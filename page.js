'use client';

import { useMemo, useState } from 'react';
import { products } from '../data/products';

const WHATSAPP = '51916599383';

function currency(value) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0
  }).format(value);
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [brand, setBrand] = useState('Todas');

  const brands = ['Todas', ...new Set(products.map(p => p.brand))];

  const filtered = useMemo(() => {
    return products.filter(product => {
      const matchesQuery = `${product.name} ${product.brand} ${product.specs.join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCategory = category === 'Todos' || product.category === category;
      const matchesBrand = brand === 'Todas' || product.brand === brand;
      return matchesQuery && matchesCategory && matchesBrand;
    });
  }, [query, category, brand]);

  const openWhatsApp = (product) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'whatsapp_click', {
        event_category: 'conversion',
        event_label: product.name,
        value: product.price
      });
    }

    const message = encodeURIComponent(
      `Hola Tiendanovamovil, estoy interesado en ${product.name} por ${currency(product.price)}. ¿Tienen stock disponible?`
    );

    window.open(`https://wa.me/${WHATSAPP}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const submitLead = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get('name');
    const phone = form.get('phone');
    const interest = form.get('interest');
    const budget = form.get('budget');

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'purchase_form_submit', {
        event_category: 'conversion',
        event_label: interest
      });
    }

    const message = encodeURIComponent(
      `Hola Tiendanovamovil.%0A%0ANombre: ${name}%0ATeléfono: ${phone}%0AProducto: ${interest}%0APresupuesto: ${budget}`
    );

    window.open(`https://wa.me/${WHATSAPP}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <header className="header">
        <a className="brand" href="#inicio">
          <img src="/logo-tiendanovamovil.png" alt="Logo Tiendanovamovil" />
          <div>
            <strong>Tienda<span>novamovil</span></strong>
            <small>PERÚ</small>
          </div>
        </a>
        <nav>
          <a href="#inicio">Inicio</a>
          <a href="#catalogo">Catálogo</a>
          <a href="#beneficios">Beneficios</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <a className="whatsappTop" href={`https://wa.me/${WHATSAPP}`} target="_blank">WhatsApp</a>
      </header>

      <main>
        <section id="inicio" className="hero">
          <div>
            <span className="eyebrow">TECNOLOGÍA PARA TU DÍA A DÍA</span>
            <h1>Compra tecnología con asesoría personalizada</h1>
            <p>
              Encuentra celulares, laptops y accesorios con garantía, atención rápida
              y envíos a todo el Perú.
            </p>
            <div className="heroActions">
              <a className="primaryBtn" href="#catalogo">Ver catálogo</a>
              <a className="secondaryBtn" href={`https://wa.me/${WHATSAPP}`} target="_blank">Consultar ofertas</a>
            </div>
            <div className="trust">
              <span>✓ Productos originales</span>
              <span>✓ Garantía</span>
              <span>✓ Envíos nacionales</span>
            </div>
          </div>

          <div className="heroVisual">
            <div className="glow"></div>
            <img src="/logo-tiendanovamovil.png" alt="Tiendanovamovil" />
            <h2>Compra fácil y segura</h2>
            <p>Elige un producto y recibe atención directa por WhatsApp.</p>
          </div>
        </section>

        <section id="catalogo" className="catalog">
          <div className="sectionHeader">
            <div>
              <span className="eyebrow">CATÁLOGO</span>
              <h2>Productos destacados</h2>
            </div>
            <input
              className="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto..."
            />
          </div>

          <div className="filters">
            {['Todos', 'Celulares', 'Laptops', 'Accesorios'].map(item => (
              <button
                key={item}
                className={category === item ? 'active' : ''}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}

            <select value={brand} onChange={(e) => setBrand(e.target.value)}>
              {brands.map(item => <option key={item}>{item}</option>)}
            </select>
          </div>

          <div className="grid">
            {filtered.map(product => (
              <article className="card" key={product.id}>
                <div className="productImage">{product.emoji}</div>
                <div className="cardBody">
                  <span className="badge">{product.badge}</span>
                  <h3>{product.name}</h3>
                  <p className="brandLine">{product.brand} · {product.condition}</p>
                  <ul>
                    {product.specs.map(spec => <li key={spec}>{spec}</li>)}
                  </ul>
                  <div className="priceBlock">
                    <small>{currency(product.oldPrice)}</small>
                    <strong>{currency(product.price)}</strong>
                    <span>{product.stock > 0 ? `Stock: ${product.stock}` : 'Agotado'}</span>
                  </div>
                  <button className="buyButton" onClick={() => openWhatsApp(product)}>
                    Comprar por WhatsApp
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="beneficios" className="benefits">
          {[
            ['🛡️', 'Garantía asegurada', 'Información clara sobre cada producto.'],
            ['🚚', 'Envíos a todo el Perú', 'Coordinación de entrega y seguimiento.'],
            ['💬', 'Atención personalizada', 'Te ayudamos a elegir según tu presupuesto.'],
            ['⚡', 'Respuesta rápida', 'Consulta precios, stock y características.']
          ].map(([icon, title, text]) => (
            <article key={title}>
              <div className="benefitIcon">{icon}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </section>

        <section id="contacto" className="contact">
          <div>
            <span className="eyebrow">SOLICITA INFORMACIÓN</span>
            <h2>¿Qué producto estás buscando?</h2>
            <p>Completa el formulario y te atenderemos directamente por WhatsApp.</p>
          </div>

          <form onSubmit={submitLead}>
            <input name="name" placeholder="Nombre completo" required />
            <input name="phone" placeholder="Teléfono o WhatsApp" required />
            <input name="interest" placeholder="Producto de interés" required />
            <select name="budget" defaultValue="Hasta S/ 1,000">
              <option>Hasta S/ 1,000</option>
              <option>S/ 1,000 a S/ 2,000</option>
              <option>S/ 2,000 a S/ 3,500</option>
              <option>Más de S/ 3,500</option>
            </select>
            <button type="submit">Enviar solicitud</button>
          </form>
        </section>
      </main>

      <a className="floatingWhatsApp" href={`https://wa.me/${WHATSAPP}`} target="_blank" aria-label="WhatsApp">
        💬
      </a>

      <footer>
        <strong>Tiendanovamovil Perú</strong>
        <span>www.tiendanovamovil.com</span>
        <span>WhatsApp: 916 599 383</span>
      </footer>
    </>
  );
}
