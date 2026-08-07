import { notFound } from 'next/navigation';
import { products } from '../../../data/products';

const WHATSAPP = '51916599383';

function currency(value) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(value);
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = products.find((item) => String(item.id) === String(id));
  if (!product) return { title: 'Producto no encontrado' };
  return {
    title: `${product.name} | Tiendanovamovil`,
    description: `${product.name}. ${product.specs.join(', ')}. Consulta stock y compra con atención personalizada.`
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = products.find((item) => String(item.id) === String(id));
  if (!product) notFound();

  const whatsappText = encodeURIComponent(`Hola Tiendanovamovil, me interesa ${product.name} por ${currency(product.price)}. ¿Tienen stock disponible?`);
  const whatsappUrl = `https://wa.me/${WHATSAPP}?text=${whatsappText}`;

  return <main className="productPage">
    <header className="productTop">
      <a className="homeLink" href="/">← Volver a Tiendanovamovil</a>
      <div>Atención por WhatsApp · Envíos coordinados a todo el Perú</div>
    </header>

    <div className="breadcrumbs"><a href="/">Inicio</a> / <a href="/#catalogo">{product.category}</a> / {product.name}</div>

    <section className="productDetail">
      <div className="galleryPanel">
        <span className="galleryBadge">{product.badge}</span>
        <img src={product.image} alt={`${product.name} ${product.condition}`} width="900" height="900" />
      </div>

      <article className="purchasePanel">
        <p className="brandText">{product.brand}</p>
        <h1>{product.name}</h1>
        <div className="conditionLine"><span>{product.condition}</span><span>•</span><span className="stockOk">{product.stock ? 'Disponible' : 'Agotado'}</span></div>

        <div className="productPrice">
          {product.oldPrice ? <del>{currency(product.oldPrice)}</del> : null}
          <strong>{currency(product.price)}</strong>
          <p className="priceNotice">Precio referencial. Confirma stock, color y condiciones antes de pagar.</p>
        </div>

        <ul className="specList">{product.specs.map((spec) => <li key={spec}>✓ {spec}</li>)}</ul>

        <div className="purchaseActions">
          <a className="purchasePrimary" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Comprar / consultar por WhatsApp</a>
          <a className="purchaseSecondary" href="/#catalogo">Seguir viendo productos</a>
        </div>

        <div className="commerceTrust">
          <div><strong>Stock confirmado</strong><span>Antes de realizar el pago</span></div>
          <div><strong>Garantía informada</strong><span>Condiciones antes de comprar</span></div>
          <div><strong>Entrega coordinada</strong><span>Lima y otras ciudades</span></div>
        </div>
      </article>
    </section>

    <section className="productInfo">
      <div className="productInfoGrid">
        <article className="infoPanel"><h2>Características del producto</h2><ul>{product.specs.map((spec) => <li key={spec}>{spec}</li>)}</ul><p>Las especificaciones se muestran de forma referencial. Confirma la versión exacta y accesorios incluidos antes de completar la compra.</p></article>
        <article className="infoPanel"><h2>Compra segura y asistencia</h2><p>Un asesor confirma disponibilidad, condición del equipo, precio final, forma de pago, garantía y modalidad de entrega antes de procesar tu pedido.</p><p><a href="/garantia">Ver política de garantía</a> · <a href="/envios">Ver información de envíos</a></p></article>
      </div>
    </section>
  </main>;
}
