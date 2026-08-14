import fs from 'node:fs/promises';

const CHANNEL_URL = process.env.YOUTUBE_CHANNEL_URL || 'https://www.youtube.com/@TiendanovamovilPer%C3%BA';
const PRODUCTS_FILE = new URL('../data/products.js', import.meta.url);
const MARGIN = Number(process.env.PRODUCT_MARGIN_PEN || 100);
const MAX_ENTRIES = Number(process.env.YOUTUBE_MAX_ENTRIES || 15);

const phoneWords = [
  'iphone', 'samsung', 'galaxy', 'xiaomi', 'redmi', 'poco', 'motorola', 'moto',
  'honor', 'realme', 'oppo', 'vivo', 'huawei', 'nokia', 'celular', 'smartphone'
];

function decodeEntities(value = '') {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripCdata(value = '') {
  return decodeEntities(value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim());
}

function textBetween(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? stripCdata(match[1]) : '';
}

function cleanTitle(title) {
  return title
    .replace(/#\w+/g, ' ')
    .replace(/\b(shorts?|oferta|promoci[oó]n|review|unboxing|precio|per[uú])\b/gi, ' ')
    .replace(/[|•🔥✅📱💥🚀]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 100);
}

function isPhone(title, description) {
  const haystack = `${title} ${description}`.toLowerCase();
  return phoneWords.some((word) => haystack.includes(word));
}

function extractUrls(text = '') {
  const urls = text.match(/https?:\/\/[^\s<>"')\]]+/g) || [];
  return urls.map((url) => decodeEntities(url.replace(/[.,;!?]+$/, '')));
}

function sourceUrlFrom(description) {
  return extractUrls(description).find((url) => !/youtube\.com|youtu\.be|tiendanovamovil\.com/i.test(url));
}

function parsePrice(text = '') {
  const patterns = [
    /(?:S\/|S\.|PEN)\s*([0-9]{2,5}(?:[.,][0-9]{1,2})?)/i,
    /(?:precio(?:\s+(?:base|referencia|referencial))?\s*[:=-]?\s*)([0-9]{2,5}(?:[.,][0-9]{1,2})?)/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1].replace('.', '').replace(',', '.'));
  }
  return null;
}

function firstMeta(html, keys) {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i')
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return decodeEntities(match[1]);
    }
  }
  return '';
}

function jsonLdProducts(html) {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const out = [];
  for (const match of matches) {
    try {
      const parsed = JSON.parse(decodeEntities(match[1].trim()));
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== 'object') continue;
        if (item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product'))) out.push(item);
        if (Array.isArray(item['@graph'])) queue.push(...item['@graph']);
      }
    } catch {}
  }
  return out;
}

async function scrapeSource(url) {
  if (!url) return {};
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; TiendanovamovilCatalogBot/1.0)',
        'accept-language': 'es-PE,es;q=0.9,en;q=0.7'
      },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) return {};
    const html = await response.text();
    const product = jsonLdProducts(html)[0] || {};
    const offers = Array.isArray(product.offers) ? product.offers[0] : (product.offers || {});
    const imageValue = Array.isArray(product.image) ? product.image[0] : product.image;
    const price = Number(offers?.price || firstMeta(html, ['product:price:amount', 'og:price:amount'])) || parsePrice(html);
    return {
      name: product.name || firstMeta(html, ['og:title', 'twitter:title']),
      image: imageValue?.url || imageValue || firstMeta(html, ['og:image', 'twitter:image']),
      price: Number.isFinite(price) && price > 0 ? price : null
    };
  } catch (error) {
    console.warn(`No se pudo leer la fuente ${url}: ${error.message}`);
    return {};
  }
}

function parseExistingProducts(source) {
  const blocks = [...source.matchAll(/\{[\s\S]*?\n\s*\},?/g)].map((m) => m[0]);
  return blocks.map((block) => ({
    block,
    name: block.match(/name:\s*['"]([^'"]+)['"]/)?.[1] || '',
    image: block.match(/image:\s*['"]([^'"]+)['"]/)?.[1] || '',
    price: Number(block.match(/price:\s*(\d+(?:\.\d+)?)/)?.[1] || 0)
  })).filter((p) => p.name);
}

function tokenScore(a, b) {
  const ignored = new Set(['gb', '5g', '4g', 'pro', 'max', 'plus', 'ultra', 'celular', 'smartphone']);
  const tokens = (s) => s.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, ' ').split(/\s+/).filter((t) => t.length > 1 && !ignored.has(t));
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  let score = 0;
  for (const token of A) if (B.has(token)) score += token.length >= 4 ? 2 : 1;
  return score;
}

function bestExisting(title, existing) {
  return existing
    .map((item) => ({ item, score: tokenScore(title, item.name) }))
    .sort((a, b) => b.score - a.score)[0];
}

function jsString(value) {
  return `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', ' ')}'`;
}

function productObject({ id, name, price, image, videoId, videoUrl, sourceUrl, published }) {
  const oldPrice = Math.ceil(price + 100);
  return `  {\n    id: ${id},\n    name: ${jsString(name)},\n    category: 'Celulares',\n    brand: ${jsString(name.split(/\\s+/)[0] || 'Smartphone')},\n    condition: 'Nuevo',\n    price: ${Math.ceil(price)},\n    oldPrice: ${oldPrice},\n    badge: 'Visto en YouTube',\n    image: ${jsString(image)},\n    specs: ['Publicado desde YouTube Shorts', 'Precio incluye S/ ${MARGIN} de margen', 'Stock sujeto a confirmación'],\n    stock: true,\n    youtubeVideoId: ${jsString(videoId)},\n    youtubeUrl: ${jsString(videoUrl)},\n    sourceUrl: ${jsString(sourceUrl || '')},\n    publishedAt: ${jsString(published)}\n  }`;
}

async function resolveChannelId() {
  const response = await fetch(CHANNEL_URL, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; TiendanovamovilCatalogBot/1.0)' },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`No se pudo abrir el canal (${response.status})`);
  const html = await response.text();
  // YouTube no siempre incluye `channelId` en las páginas de canales con handle.
  // Actualmente suele exponer el identificador como `externalId`, `browseId`
  // o dentro de la URL canónica /channel/UC..., por lo que admitimos todos.
  const id = html.match(/"channelId":"(UC[A-Za-z0-9_-]+)"/)?.[1]
    || html.match(/"externalId":"(UC[A-Za-z0-9_-]+)"/)?.[1]
    || html.match(/"browseId":"(UC[A-Za-z0-9_-]+)"/)?.[1]
    || html.match(/youtube\.com\/channel\/(UC[A-Za-z0-9_-]+)/i)?.[1]
    || html.match(/<meta[^>]+itemprop=["']channelId["'][^>]+content=["'](UC[^"']+)["']/i)?.[1];
  if (!id) throw new Error('No se pudo identificar el channelId de YouTube.');
  return id;
}

async function fetchFeed(channelId) {
  const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; TiendanovamovilCatalogBot/1.0)' },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`No se pudo leer el feed de YouTube (${response.status})`);
  const xml = await response.text();
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)]
    .slice(0, MAX_ENTRIES)
    .map((m) => {
      const entry = m[1];
      const videoId = textBetween(entry, 'yt:videoId');
      return {
        videoId,
        title: textBetween(entry, 'title'),
        published: textBetween(entry, 'published'),
        description: textBetween(entry, 'media:description'),
        videoUrl: `https://www.youtube.com/shorts/${videoId}`
      };
    })
    .filter((entry) => entry.videoId);
}

async function main() {
  let source = await fs.readFile(PRODUCTS_FILE, 'utf8');
  const knownIds = new Set([...source.matchAll(/youtubeVideoId:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]));
  const existing = parseExistingProducts(source);
  const channelId = await resolveChannelId();
  const entries = await fetchFeed(channelId);
  const additions = [];

  for (const entry of entries.reverse()) {
    if (knownIds.has(entry.videoId) || !isPhone(entry.title, entry.description)) continue;

    const sourceUrl = sourceUrlFrom(entry.description);
    const scraped = await scrapeSource(sourceUrl);
    const descriptionPrice = parsePrice(entry.description);
    const matched = bestExisting(entry.title, existing);
    const strongMatch = matched && matched.score >= 4 ? matched.item : null;

    let basePrice = scraped.price || descriptionPrice;
    let finalPrice = basePrice ? basePrice + MARGIN : null;
    let image = scraped.image || '';

    // Si el modelo ya existe en el catálogo, reutilizamos su foto y su precio publicado
    // (los precios actuales ya incluyen S/100 sobre la referencia).
    if (!finalPrice && strongMatch) finalPrice = strongMatch.price;
    if (!image && strongMatch) image = strongMatch.image;

    // Último recurso visual: miniatura real del Short. El producto se omite si no hay precio confiable.
    if (!image) image = `https://i.ytimg.com/vi/${entry.videoId}/maxresdefault.jpg`;

    if (!finalPrice || finalPrice <= 0) {
      console.warn(`Omitido ${entry.videoId}: falta precio. Añade un enlace de producto o "Precio referencia: S/ 000" en la descripción del Short.`);
      continue;
    }

    const name = cleanTitle(scraped.name || entry.title || strongMatch?.name || 'Celular');
    const numericId = 10_000_000_000 + Math.floor(new Date(entry.published).getTime() / 1000);
    additions.push(productObject({
      id: numericId,
      name,
      price: finalPrice,
      image,
      videoId: entry.videoId,
      videoUrl: entry.videoUrl,
      sourceUrl,
      published: entry.published
    }));
    knownIds.add(entry.videoId);
  }

  if (!additions.length) {
    console.log('Sin productos nuevos para publicar.');
    return;
  }

  const marker = /\n\];\s*$/;
