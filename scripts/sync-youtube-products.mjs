import fs from 'node:fs/promises';

const CHANNEL_URL = process.env.YOUTUBE_CHANNEL_URL || 'https://www.youtube.com/@TiendanovamovilPer%C3%BA';
const PRODUCTS_FILE = new URL('../data/products.js', import.meta.url);
const MARGIN = Number(process.env.PRODUCT_MARGIN_PEN || 100);
const MAX_ENTRIES = Number(process.env.YOUTUBE_MAX_ENTRIES || 15);

const productWords = ['iphone','samsung','galaxy','xiaomi','redmi','poco','motorola','moto','honor','realme','oppo','vivo','huawei','nokia','celular','smartphone','macbook','laptop','notebook','ipad','tablet','acer','asus','lenovo','dell','hp'];

function decodeEntities(value = '') {
  return value.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
function stripCdata(value = '') { return decodeEntities(value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim()); }
function textBetween(xml, tag) { const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')); return m ? stripCdata(m[1]) : ''; }
function cleanTitle(title) { return title.replace(/#\w+/g,' ').replace(/\b(shorts?|oferta|promoci[oó]n|review|unboxing|precio|per[uú]|cta|v\d+)\b/gi,' ').replace(/[|•🔥✅📱💥🚀–—_]/g,' ').replace(/\s{2,}/g,' ').trim().slice(0,100); }
function isProduct(title, description) { const h = `${title} ${description}`.toLowerCase(); return productWords.some((w) => h.includes(w)); }
function extractUrls(text='') { return (text.match(/https?:\/\/[^\s<>"')\]]+/g)||[]).map((u)=>decodeEntities(u.replace(/[.,;!?]+$/,''))); }
function sourceUrlFrom(description) { return extractUrls(description).find((u)=>!/youtube\.com|youtu\.be|tiendanovamovil\.com/i.test(u)); }
function parsePrice(text='') {
  for (const p of [/(?:S\/|S\.|PEN)\s*([0-9]{2,5}(?:[.,][0-9]{1,2})?)/i,/(?:precio(?:\s+(?:base|referencia|referencial))?\s*[:=-]?\s*)([0-9]{2,5}(?:[.,][0-9]{1,2})?)/i]) {
    const m=text.match(p); if(m) return Number(m[1].replace(/\.(?=\d{3}\b)/g,'').replace(',','.'));
  }
  return null;
}
function firstMeta(html, keys) {
  for(const key of keys){ const e=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); for(const p of [new RegExp(`<meta[^>]+(?:property|name)=["']${e}["'][^>]+content=["']([^"']+)["'][^>]*>`,'i'),new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${e}["'][^>]*>`,'i')]){ const m=html.match(p); if(m) return decodeEntities(m[1]); } }
  return '';
}
function jsonLdProducts(html){ const out=[]; for(const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){ try{ const parsed=JSON.parse(m[1].trim()); const q=Array.isArray(parsed)?[...parsed]:[parsed]; while(q.length){ const x=q.shift(); if(!x||typeof x!=='object') continue; const t=x['@type']; if(t==='Product'||(Array.isArray(t)&&t.includes('Product'))) out.push(x); if(Array.isArray(x['@graph'])) q.push(...x['@graph']); } }catch{} } return out; }
async function scrapeSource(url){ if(!url) return {}; try{ const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; TiendanovamovilCatalogBot/1.0)','accept-language':'es-PE,es;q=0.9'},signal:AbortSignal.timeout(15000)}); if(!r.ok) return {}; const html=await r.text(); const product=jsonLdProducts(html)[0]||{}; const offers=Array.isArray(product.offers)?product.offers[0]:(product.offers||{}); const imageValue=Array.isArray(product.image)?product.image[0]:product.image; const price=Number(offers?.price||firstMeta(html,['product:price:amount','og:price:amount']))||parsePrice(html); return {name:product.name||firstMeta(html,['og:title','twitter:title']),image:imageValue?.url||imageValue||firstMeta(html,['og:image','twitter:image']),price:Number.isFinite(price)&&price>0?price:null}; }catch(e){ console.warn(`No se pudo leer ${url}: ${e.message}`); return {}; } }
function parseExistingProducts(source){ return [...source.matchAll(/\{[\s\S]*?\n\s*\},?/g)].map((m)=>m[0]).map((block)=>({name:block.match(/name:\s*['"]([^'"]+)['"]/)?.[1]||'',image:block.match(/image:\s*['"]([^'"]+)['"]/)?.[1]||'',price:Number(block.match(/price:\s*(\d+(?:\.\d+)?)/)?.[1]||0)})).filter((p)=>p.name); }
function tokenScore(a,b){ const ignored=new Set(['gb','5g','4g','pro','max','plus','ultra','celular','smartphone']); const tokens=(s)=>s.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi,' ').split(/\s+/).filter((t)=>t.length>1&&!ignored.has(t)); const A=new Set(tokens(a)),B=new Set(tokens(b)); let score=0; for(const t of A) if(B.has(t)) score+=t.length>=4?2:1; return score; }
function bestExisting(title,existing){ return existing.map((item)=>({item,score:tokenScore(title,item.name)})).sort((a,b)=>b.score-a.score)[0]; }
function jsString(v){ return `'${String(v).replaceAll('\\','\\\\').replaceAll("'","\\'").replaceAll('\n',' ')}'`; }
function inferBrand(name){ const lower=name.toLowerCase(); if(/iphone|ipad|macbook/.test(lower)) return 'Apple'; for(const b of ['Samsung','Xiaomi','Redmi','POCO','HONOR','Motorola','Realme','OPPO','Vivo','Huawei','Nokia','Acer','ASUS','Lenovo','Dell','HP']) if(lower.includes(b.toLowerCase())) return b; return 'Tecnología'; }
function inferCategory(name){ const l=name.toLowerCase(); if(/macbook|laptop|notebook|acer|asus|lenovo|dell|hp/.test(l)) return 'Laptops'; if(/ipad|tablet/.test(l)) return 'Accesorios'; return 'Celulares'; }
function productObject({id,name,price,image,videoId,videoUrl,sourceUrl,published}){ const oldPrice=Math.ceil(price+100); return `  {\n    id: ${id},\n    name: ${jsString(name)},\n    category: ${jsString(inferCategory(name))},\n    brand: ${jsString(inferBrand(name))},\n    condition: 'Nuevo',\n    price: ${Math.ceil(price)},\n    oldPrice: ${oldPrice},\n    badge: 'Visto en YouTube',\n    image: ${jsString(image)},\n    specs: ['Publicado automáticamente desde YouTube', 'Precio incluye S/ ${MARGIN} de margen', 'Stock sujeto a confirmación'],\n    stock: true,\n    youtubeVideoId: ${jsString(videoId)},\n    youtubeUrl: ${jsString(videoUrl)},\n    sourceUrl: ${jsString(sourceUrl||'')},\n    publishedAt: ${jsString(published)}\n  }`; }
async function resolveChannelId(){ const r=await fetch(CHANNEL_URL,{headers:{'user-agent':'Mozilla/5.0'},signal:AbortSignal.timeout(15000)}); if(!r.ok) throw new Error(`No se pudo abrir el canal (${r.status})`); const html=await r.text(); const id=html.match(/"channelId":"(UC[A-Za-z0-9_-]+)"/)?.[1]||html.match(/"externalId":"(UC[A-Za-z0-9_-]+)"/)?.[1]||html.match(/"browseId":"(UC[A-Za-z0-9_-]+)"/)?.[1]||html.match(/youtube\.com\/channel\/(UC[A-Za-z0-9_-]+)/i)?.[1]; if(!id) throw new Error('No se pudo identificar el channelId de YouTube.'); return id; }
async function fetchFeed(channelId){ const r=await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,{headers:{'user-agent':'Mozilla/5.0'},signal:AbortSignal.timeout(15000)}); if(!r.ok) throw new Error(`No se pudo leer el feed (${r.status})`); const xml=await r.text(); return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].slice(0,MAX_ENTRIES).map((m)=>{const e=m[1],videoId=textBetween(e,'yt:videoId'); return {videoId,title:textBetween(e,'title'),published:textBetween(e,'published'),description:textBetween(e,'media:description'),videoUrl:`https://www.youtube.com/shorts/${videoId}`};}).filter((e)=>e.videoId); }

async function main(){
  let source=await fs.readFile(PRODUCTS_FILE,'utf8');
  const knownIds=new Set([...source.matchAll(/youtubeVideoId:\s*['"]([^'"]+)['"]/g)].map((m)=>m[1]));
  const existing=parseExistingProducts(source);
  const channelId=await resolveChannelId();
  const entries=await fetchFeed(channelId);
  const additions=[];

  for(const entry of entries.reverse()){
    if(knownIds.has(entry.videoId)||!isProduct(entry.title,entry.description)) continue;
    const sourceUrl=sourceUrlFrom(entry.description);
    const scraped=await scrapeSource(sourceUrl);
    const descriptionPrice=parsePrice(entry.description);
    const matched=bestExisting(entry.title,existing);
    const strongMatch=matched&&matched.score>=4?matched.item:null;
    let finalPrice=scraped.price? scraped.price+MARGIN : descriptionPrice? descriptionPrice+MARGIN : null;
    let image=scraped.image||strongMatch?.image||`https://i.ytimg.com/vi/${entry.videoId}/hqdefault.jpg`;
    if(!finalPrice&&strongMatch?.price) finalPrice=strongMatch.price;
    if(!finalPrice||finalPrice<=0){ console.warn(`Omitido ${entry.videoId}: falta precio. Añade en la descripción "Precio referencia: S/ 000" o un enlace de la tienda fuente.`); continue; }
    const name=cleanTitle(scraped.name||entry.title||strongMatch?.name||'Producto');
    const numericId=10_000_000_000+Math.floor(new Date(entry.published).getTime()/1000);
    additions.push(productObject({id:numericId,name,price:finalPrice,image,videoId:entry.videoId,videoUrl:entry.videoUrl,sourceUrl,published:entry.published||new Date().toISOString()}));
    knownIds.add(entry.videoId);
  }

  if(!additions.length){ console.log('Sin productos nuevos para publicar.'); return; }
  const marker=/\n\];\s*$/;
  if(!marker.test(source)) throw new Error('No se encontró el final de data/products.js');
  source=source.replace(marker,',\n'+additions.join(',\n')+'\n];\n');
  await fs.writeFile(PRODUCTS_FILE,source,'utf8');
  console.log(`Publicados ${additions.length} producto(s) nuevo(s).`);
}

main().catch((error)=>{ console.error(error); process.exit(1); });
