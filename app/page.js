'use client';

import { useMemo, useState } from 'react';
import { products } from '../data/products';
import ReviewsSection from '../components/ReviewsSection';
import AnalyticsConsent from '../components/AnalyticsConsent';

const WHATSAPP = '51916599383';
const categories = ['Todos', 'Celulares', 'Laptops', 'Accesorios'];

function currency(value) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(value);
}

function sendEvent(name, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') window.gtag('event', name, params);
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.5 4.1 1.6 5.9L.2 24l6.5-1.7c1.7.9 3.6 1.4 5.5 1.4 6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.5-8.4Zm-8.4 18.2c-1.7 0-3.5-.5-5-1.4l-.4-.2-3.8 1 1-3.7-.2-.4a9.8 9.8 0 1 1 8.4 4.7Zm5.4-7.4c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.1-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.6c.2.2 2.4 3.7 5.9 5.2 2.2.9 3 .9 4.1.8.7-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.3Z" /></svg>;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [brand, setBrand] = useState('Todas');
  const [sort, setSort] = useState('recomendados');
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [selected, setSelected] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);

  const brands = ['Todas', ...new Set(products.map((product) => product.brand))];

  const filtered = useMemo(() => {
    const list = products.filter((product) => {
      const searchable = `${product.name} ${product.brand} ${product.specs.join(' ')}`.toLowerCase();
      return searchable.includes(query.trim().toLowerCase())
        && (category === 'Todos' || product.category === category)
        && (brand === 'Todas' || product.brand === brand);
    });
    return [...list].sort((a, b) => sort === 'menor' ? a.price - b.price : sort === 'mayor' ? b.price - a.price : a.id - b.id);
  }, [query, category, brand, sort]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const whatsappUrl = (text = 'Hola Tiendanovamovil, quisiera conocer sus ofertas disponibles.') => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

  const openWhatsApp = (product) => {
    sendEvent('whatsapp_click', { event_category: 'conversion', event_label: product.name, value: product.price, currency: 'PEN' });
    window.open(whatsappUrl(`Hola Tiendanovamovil, me interesa ${product.name} por ${currency(product.price)}. ¿Tienen stock disponible?`), '_blank', 'noopener,noreferrer');
  };

  const toggleWishlist = (id) => setWishlist((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const addToCart = (product) => { setCart((current) => [...current, product]); setCartOpen(true); sendEvent('add_to_cart', { item_name: product.name, value: product.price, currency: 'PEN' }); };
  const checkout = () => {
    const lines = cart.map((item) => `• ${item.name} — ${currency(item.price)}`).join('\n');
    window.open(whatsappUrl(`Hola Tiendanovamovil, deseo cotizar este pedido:\n${lines}\n\nTotal referencial: ${currency(cartTotal)}`), '_blank', 'noopener,noreferrer');
  };

  const submitLead = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    sendEvent('purchase_form_submit', { event_category: 'conversion', event_label: form.get('interest') });
    window.open(whatsappUrl(`Hola Tiendanovamovil.\n\nNombre: ${form.get('name')}\nTeléfono: ${form.get('phone')}\nProducto: ${form.get('interest')}\nPresupuesto: ${form.get('budget')}`), '_blank', 'noopener,noreferrer');
  };

  return <>
    <a className="skipLink" href="#contenido">Ir al contenido</a>
    <div className="promoBar">Envíos coordinados a todo el Perú · Atención personalizada · Stock sujeto a confirmación</div>
    <header className="header">
      <a className="brand" href="#inicio" aria-label="Tiendanovamovil, inicio"><img src="/logo-tiendanovamovil.png" alt="" width="48" height="48" /><div><strong>Tienda<span>nova</span>movil</strong><small>TECNOLOGÍA · PERÚ</small></div></a>
      <nav aria-label="Navegación principal"><a href="#inicio">Inicio</a><a href="#catalogo">Catálogo</a><a href="#beneficios">Beneficios</a><a href="#opiniones">Opiniones</a><a href="#contacto">Contacto</a></nav>
      <div className="headerTools"><button className="iconTool" onClick={() => setCartOpen(true)} aria-label="Abrir carrito">🛒 <b>{cart.length}</b></button><a className="whatsappTop" href={whatsappUrl()} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Cotizar</a></div>
    </header>

    <main id="contenido">
      <section id="inicio" className="hero">
        <div className="heroCopy"><span className="eyebrow"><i /> TIENDA ONLINE DE TECNOLOGÍA</span><h1>Compra tecnología<br /><em>con confianza.</em></h1><p>Una experiencia de compra moderna para comparar celulares, laptops y accesorios, guardar favoritos y solicitar una cotización directa.</p><div className="heroActions"><a className="primaryBtn" href="#catalogo">Ver productos <span>→</span></a><a className="secondaryBtn" href={whatsappUrl()} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Hablar con un asesor</a></div><div className="trust"><span><b>✓</b> Precios claros</span><span><b>✓</b> Atención directa</span><span><b>✓</b> Reseñas moderadas</span></div></div>
        <div className="heroVisual"><div className="visualTag">TIENDANOVAMOVIL 3.0</div><div className="device laptop"><span /></div><div className="device phone"><span /></div><div className="visualCard"><strong>Catálogo inteligente</strong><span>Busca, filtra, guarda y cotiza</span></div></div>
      </section>

      <section className="stats"><div><strong>20 productos seleccionados</strong><span>Catálogo inicial preparado para crecer</span></div><div><strong>Favoritos y carrito</strong><span>Organiza tu compra antes de cotizar</span></div><div><strong>Opiniones reales</strong><span>Moderación antes de publicar</span></div></section>

      <section id="catalogo" className="catalog">
        <div className="sectionHeader"><div><span className="eyebrow">CATÁLOGO</span><h2>Encuentra tu próximo equipo</h2><p>{filtered.length} resultados · Precios sujetos a confirmación de stock</p></div><label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar modelo, marca o característica" /></label></div>
        <div className="filters"><div>{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="selectFilters"><label>Marca <select value={brand} onChange={(e) => setBrand(e.target.value)}>{brands.map((item) => <option key={item}>{item}</option>)}</select></label><label>Ordenar <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="recomendados">Recomendados</option><option value="menor">Menor precio</option><option value="mayor">Mayor precio</option></select></label></div></div>

        {filtered.length ? <div className="grid">{filtered.map((product) => <article className="card" key={product.id}>
          <div className={`productImage ${product.category.toLowerCase()}`}><span className="productBadge">{product.badge}</span><button className={`wishButton ${wishlist.includes(product.id) ? 'liked' : ''}`} onClick={() => toggleWishlist(product.id)} aria-label="Guardar favorito">♥</button><a className="productLink" href={`/producto/${product.id}`}><img src={product.image} alt={`${product.name} ${product.condition}`} width="800" height="800" loading="lazy" /></a></div>
          <div className="cardBody"><p className="brandLine">{product.brand} · {product.condition}</p><h3>{product.name}</h3><ul>{product.specs.map((spec) => <li key={spec}>{spec}</li>)}</ul><div className="priceBlock"><div><small>{currency(product.oldPrice)}</small><strong>{currency(product.price)}</strong></div><span>{product.stock ? 'Disponible' : 'Agotado'}</span></div><div className="cardActions"><a className="detailButton" href={`/producto/${product.id}`}>Ficha completa</a><button className="cartButton" onClick={() => addToCart(product)} disabled={!product.stock}>+ Carrito</button></div><button className="buyButton" onClick={() => openWhatsApp(product)} disabled={!product.stock}><WhatsAppIcon /> Comprar por WhatsApp</button></div>
        </article>)}</div> : <div className="empty"><strong>No encontramos coincidencias</strong><p>Prueba con otra búsqueda.</p></div>}
      </section>

      <section id="beneficios" className="benefitsIntro"><span className="eyebrow">COMPRA TRANQUILO</span><h2>Una experiencia pensada para vender mejor</h2><div className="benefits">{[['01','Comparación simple','Filtra por categoría, marca y precio para encontrar el equipo adecuado.'],['02','Información clara','Características, condición, disponibilidad y precio visibles antes de consultar.'],['03','Cotización directa','Carrito y WhatsApp trabajan juntos para reducir pasos antes de la compra.'],['04','Confianza social','Reseñas con estrellas y moderación antes de hacerse públicas.']].map(([n,t,p]) => <article key={t}><span>{n}</span><h3>{t}</h3><p>{p}</p></article>)}</div></section>

      <ReviewsSection />

      <section id="contacto" className="contact"><div><span className="eyebrow">ASESORÍA PERSONALIZADA</span><h2>¿No sabes cuál elegir?</h2><p>Déjanos tus datos y abriremos WhatsApp con una solicitud lista para enviar.</p><div className="contactNote"><WhatsAppIcon /><div><strong>Atención directa</strong><span>WhatsApp: +51 916 599 383</span></div></div></div><form onSubmit={submitLead}><label>Nombre<input name="name" required /></label><label>Teléfono<input name="phone" type="tel" required /></label><label>Producto de interés<input name="interest" required /></label><label>Presupuesto<select name="budget" defaultValue="Hasta S/ 1,000"><option>Hasta S/ 1,000</option><option>S/ 1,000 a S/ 2,000</option><option>S/ 2,000 a S/ 3,500</option><option>Más de S/ 3,500</option></select></label><button type="submit">Solicitar recomendación <span>→</span></button><small>Usaremos estos datos únicamente para responder tu solicitud.</small></form></section>
    </main>

    {selected && <div className="modalBackdrop" onClick={() => setSelected(null)}><div className="productModal" onClick={(e) => e.stopPropagation()}><button className="modalClose" onClick={() => setSelected(null)}>×</button><img src={selected.image} alt={selected.name} /><div><span className="eyebrow">{selected.brand}</span><h2>{selected.name}</h2><p>{selected.condition} · {selected.stock ? 'Disponible' : 'Sin stock'}</p><ul>{selected.specs.map((spec) => <li key={spec}>{spec}</li>)}</ul><strong className="modalPrice">{currency(selected.price)}</strong><button className="buyButton" onClick={() => openWhatsApp(selected)}><WhatsAppIcon /> Consultar disponibilidad</button></div></div></div>}

    {cartOpen && <aside className="cartDrawer"><div className="cartHeader"><div><strong>Tu carrito</strong><small>{cart.length} productos</small></div><button onClick={() => setCartOpen(false)}>×</button></div><div className="cartItems">{cart.length ? cart.map((item, index) => <div className="cartItem" key={`${item.id}-${index}`}><img src={item.image} alt="" /><div><strong>{item.name}</strong><span>{currency(item.price)}</span></div><button onClick={() => setCart((current) => current.filter((_, i) => i !== index))}>Eliminar</button></div>) : <p>Tu carrito está vacío.</p>}</div><div className="cartFooter"><div><span>Total referencial</span><strong>{currency(cartTotal)}</strong></div><button onClick={checkout} disabled={!cart.length}><WhatsAppIcon /> Cotizar carrito</button></div></aside>}

    <a className="floatingWhatsApp" href={whatsappUrl()} target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp"><WhatsAppIcon /></a>
    <AnalyticsConsent />
    <footer><div className="footerBrand"><img src="/logo-tiendanovamovil.png" alt="" width="42" height="42" /><div><strong>Tiendanovamovil</strong><span>Tecnología para todos</span></div></div><p>Catálogo tecnológico con atención personalizada en Perú.</p><div className="footerLegal"><a href="#catalogo">Catálogo</a><a href="/envios">Envíos</a><a href="/garantia">Garantía</a><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></div><small>© {new Date().getFullYear()} Tiendanovamovil Perú. Todos los derechos reservados.</small></footer>
  </>;
}
