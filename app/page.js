'use client';

import { useMemo, useState } from 'react';
import { products } from '../data/products';

const WHATSAPP = '51953587927';
const categories = ['Todos', 'Celulares', 'Laptops', 'Accesorios'];

function currency(value) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: 'PEN', maximumFractionDigits: 0
  }).format(value);
}

function sendEvent(name, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.5 4.1 1.6 5.9L.2 24l6.5-1.7c1.7.9 3.6 1.4 5.5 1.4 6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.5-8.4Zm-8.4 18.2c-1.7 0-3.5-.5-5-1.4l-.4-.2-3.8 1 1-3.7-.2-.4a9.8 9.8 0 1 1 8.4 4.7Zm5.4-7.4c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.1-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.6c.2.2 2.4 3.7 5.9 5.2 2.2.9 3 .9 4.1.8.7-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.3Z" /></svg>;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [brand, setBrand] = useState('Todas');
  const brands = ['Todas', ...new Set(products.map((product) => product.brand))];

  const filtered = useMemo(() => products.filter((product) => {
    const searchable = `${product.name} ${product.brand} ${product.specs.join(' ')}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase())
      && (category === 'Todos' || product.category === category)
      && (brand === 'Todas' || product.brand === brand);
  }), [query, category, brand]);

  const whatsappUrl = (text = 'Hola Tiendanovamovil, quisiera conocer sus ofertas disponibles.') =>
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

  const openWhatsApp = (product) => {
    sendEvent('whatsapp_click', {
      event_category: 'conversion', event_label: product.name, value: product.price, currency: 'PEN'
    });
    window.open(whatsappUrl(`Hola Tiendanovamovil, me interesa ${product.name} por ${currency(product.price)}. ¿Tienen stock disponible?`), '_blank', 'noopener,noreferrer');
  };

  const submitLead = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    sendEvent('purchase_form_submit', { event_category: 'conversion', event_label: form.get('interest') });
    const message = `Hola Tiendanovamovil.\n\nNombre: ${form.get('name')}\nTeléfono: ${form.get('phone')}\nProducto: ${form.get('interest')}\nPresupuesto: ${form.get('budget')}`;
    window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer');
  };

  return <>
    <a className="skipLink" href="#contenido">Ir al contenido</a>
    <header className="header">
      <a className="brand" href="#inicio" aria-label="Tiendanovamovil, inicio">
        <img src="/logo-tiendanovamovil.png" alt="" width="48" height="48" />
        <div><strong>Tienda<span>nova</span>movil</strong><small>TECNOLOGÍA · PERÚ</small></div>
      </a>
      <nav aria-label="Navegación principal">
        <a href="#inicio">Inicio</a><a href="#catalogo">Catálogo</a><a href="#beneficios">Por qué elegirnos</a><a href="#contacto">Contacto</a>
      </nav>
      <a className="whatsappTop" href={whatsappUrl()} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Cotizar ahora</a>
    </header>

    <main id="contenido">
      <section id="inicio" className="hero">
        <div className="heroCopy">
          <span className="eyebrow"><i /> TECNOLOGÍA CON ATENCIÓN PERSONAL</span>
          <h1>El equipo ideal,<br /><em>sin complicaciones.</em></h1>
          <p>Celulares, laptops y accesorios seleccionados para cada presupuesto. Te asesoramos antes de comprar y coordinamos envíos a todo el Perú.</p>
          <div className="heroActions">
            <a className="primaryBtn" href="#catalogo">Explorar catálogo <span>→</span></a>
            <a className="secondaryBtn" href={whatsappUrl()} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Hablar con un asesor</a>
          </div>
          <div className="trust"><span><b>✓</b> Productos verificados</span><span><b>✓</b> Garantía informada</span><span><b>✓</b> Envíos nacionales</span></div>
        </div>
        <div className="heroVisual" aria-label="Catálogo de tecnología">
          <div className="visualTag">OFERTAS DE LA SEMANA</div>
          <div className="device laptop"><span /></div><div className="device phone"><span /></div>
          <div className="visualCard"><strong>Compra con confianza</strong><span>Asesoría directa por WhatsApp</span></div>
        </div>
      </section>

      <section className="stats" aria-label="Ventajas de compra">
        <div><strong>Atención directa</strong><span>Sin respuestas automáticas</span></div>
        <div><strong>Compra informada</strong><span>Compara antes de decidir</span></div>
        <div><strong>Cobertura nacional</strong><span>Coordinamos tu entrega</span></div>
      </section>

      <section id="catalogo" className="catalog">
          <div className="sectionHeader"><div><span className="eyebrow">NUESTRO CATÁLOGO</span><h2>Encuentra tu próximo equipo</h2><p>{filtered.length} productos disponibles · Precios referenciales sujetos a confirmación</p></div>
          <label className="search"><span aria-hidden="true">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar modelo o característica" aria-label="Buscar productos" /></label>
        </div>
        <div className="filters" aria-label="Filtros de productos">
          <div>{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}</div>
          <label>Marca <select value={brand} onChange={(e) => setBrand(e.target.value)}>{brands.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>

        {filtered.length ? <div className="grid">{filtered.map((product) => <article className="card" key={product.id}>
          <div className={`productImage ${product.category.toLowerCase()}`}><span className="productBadge">{product.badge}</span><img src={product.image} alt={`${product.name} ${product.condition}`} width="800" height="800" loading="lazy" /></div>
          <div className="cardBody"><p className="brandLine">{product.brand} · {product.condition}</p><h3>{product.name}</h3>
            <ul>{product.specs.map((spec) => <li key={spec}>{spec}</li>)}</ul>
            <div className="priceBlock"><div><small>{currency(product.oldPrice)}</small><strong>{currency(product.price)}</strong></div><span className={product.stock ? '' : 'out'}>{product.stock ? 'Disponible' : 'Agotado'}</span></div>
            <button className="buyButton" onClick={() => openWhatsApp(product)} disabled={!product.stock}><WhatsAppIcon /> {product.stock ? 'Consultar por WhatsApp' : 'Sin stock'}</button>
          </div>
        </article>)}</div> : <div className="empty"><strong>No encontramos coincidencias</strong><p>Prueba con otra palabra o elimina los filtros.</p><button onClick={() => { setQuery(''); setCategory('Todos'); setBrand('Todas'); }}>Limpiar filtros</button></div>}
      </section>

      <section id="beneficios" className="benefitsIntro"><span className="eyebrow">COMPRA TRANQUILO</span><h2>Te acompañamos en cada paso</h2>
        <div className="benefits">{[
          ['01', 'Asesoría real', 'Recomendaciones según el uso que le darás y el presupuesto disponible.'],
          ['02', 'Información clara', 'Conoce precio, condición, características y disponibilidad antes de comprar.'],
          ['03', 'Entrega coordinada', 'Confirmamos contigo los detalles de pago y envío antes de despachar.'],
          ['04', 'Soporte por WhatsApp', 'Un canal directo para resolver tus dudas de forma rápida.']
        ].map(([number, title, text]) => <article key={title}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section id="contacto" className="contact"><div><span className="eyebrow">COTIZACIÓN PERSONALIZADA</span><h2>Cuéntanos qué estás buscando</h2><p>Completa tus datos y se abrirá WhatsApp con tu solicitud lista para enviar.</p><div className="contactNote"><WhatsAppIcon /><div><strong>Respuesta directa</strong><span>WhatsApp: +51 953 587 927</span></div></div></div>
        <form onSubmit={submitLead}><label>Nombre completo<input name="name" autoComplete="name" placeholder="Escribe tu nombre" required /></label><label>Teléfono o WhatsApp<input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ej. 999 999 999" pattern="[0-9 +()-]{7,}" required /></label><label>Producto de interés<input name="interest" placeholder="Ej. iPhone, laptop para oficina..." required /></label><label>Presupuesto<select name="budget" defaultValue="Hasta S/ 1,000"><option>Hasta S/ 1,000</option><option>S/ 1,000 a S/ 2,000</option><option>S/ 2,000 a S/ 3,500</option><option>Más de S/ 3,500</option></select></label><button type="submit">Solicitar cotización <span>→</span></button><small>Al continuar, aceptas ser contactado para responder esta solicitud.</small></form>
      </section>
    </main>

    <a className="floatingWhatsApp" href={whatsappUrl()} target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp"><WhatsAppIcon /></a>
    <footer><div className="footerBrand"><img src="/logo-tiendanovamovil.png" alt="" width="42" height="42" /><div><strong>Tiendanovamovil</strong><span>Tecnología para todos</span></div></div><p>Celulares, laptops y accesorios con atención personalizada en Perú.</p><div><a href="#catalogo">Catálogo</a><a href="#beneficios">Beneficios</a><a href="#contacto">Contacto</a></div><small>© {new Date().getFullYear()} Tiendanovamovil Perú. Todos los derechos reservados.</small></footer>
  </>;
}
