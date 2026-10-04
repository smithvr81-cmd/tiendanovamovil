import Image from 'next/image';
import { products } from '../../data/products';
import ProvinceQuote from '../../components/ProvinceQuote';
import AnalyticsConsent from '../../components/AnalyticsConsent';
import styles from './provincia.module.css';

export const metadata = {
  title: 'Celulares de gama media para provincias',
  description: 'Mira los videos, compara celulares de gama media y cotiza precio final y envío a tu ciudad con Tienda Móvil.',
  alternates: { canonical: '/ofertas-provincia' }
};
const selection = [
  { id: 2026100401, video: '/videos/redmi-note-14-pro-nova.mp4', caption: 'Redmi con Nova', note: 'Confirma si buscas Pro o Pro+; son versiones distintas.' },
  { id: 2026081701, video: '/videos/nova-honor-400-lite.mp4', caption: 'HONOR con Nova' },
  { id: 2026091202, youtube: '4y-vnP8lg0s', caption: 'POCO X7 Pro' }
];
export default function ProvinceOffers() {
  const items = selection.map(item => ({ ...products.find(p => p.id === item.id), ...item }));
  return <div className={styles.page}>
    <a className={styles.skip} href="#equipos">Ir a los celulares</a>
    <header className={styles.header}><a href="/" aria-label="Volver a Tienda Móvil"><Image src="/logo-tiendanovamovil.png" alt="" width={44} height={44} unoptimized /> <strong>Tienda Móvil</strong></a><a href="#cotizar">Cotizar envío →</a></header>
    <main>
      <section className={styles.hero}><span className={styles.kicker}>GAMA MEDIA · ATENCIÓN PARA PROVINCIAS</span><h1>Tu próximo celular,<br/><em>más cerca de ti.</em></h1><p>Mira nuestros videos, compara tres equipos y solicita una cotización para tu ciudad. Stock disponible en Lima, garantía de un año y envíos por Shalom. Recibe el precio final por WhatsApp antes de pagar.</p><a className={styles.primary} href="#equipos">Ver celulares y videos ↓</a><div className={styles.benefits}><span>✓ Atención por WhatsApp</span><span>✓ Garantía de 1 año</span><span>✓ Envíos por Shalom</span></div></section>
      <section id="equipos" className={styles.section}><span className={styles.kicker}>ELIGE Y COTIZA</span><h2>Encuentra el que va contigo</h2><p>Stock disponible · Garantía de 1 año · Envíos por Shalom. Precios referenciales revisados el 04/10/2026; precio final y envío por WhatsApp.</p>
        <div className={styles.grid}>{items.map(p => <article className={styles.card} key={p.id}>
          <div className={styles.media}>{p.video ? <video src={p.video} controls playsInline preload="none" poster={p.image} aria-label={p.caption}/> : <iframe src={'https://www.youtube-nocookie.com/embed/' + p.youtube} title={'Video de ' + p.name} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>}</div>
          <div className={styles.body}><span className={styles.kicker}>{p.brand} · {p.condition}</span><h3>{p.name}</h3><ul>{p.specs.map(s => <li key={s}>{s}</li>)}</ul><small>Precio referencial del equipo</small><strong className={styles.price}>{p.priceVerified && Number.isFinite(p.price) ? new Intl.NumberFormat('es-PE', {style:'currency',currency:'PEN',maximumFractionDigits:0}).format(p.price) : 'Consultar precio'}</strong><small>Stock disponible · Garantía de 1 año · Envío aparte</small>{p.note && <p className={styles.note}>{p.note}</p>}<a className={styles.primary} href={'#cotizar-' + p.id}>Cotizar este equipo y envío →</a><a className={styles.detail} href={'/producto/' + p.id}>Ver ficha completa</a></div>
        </article>)}</div>
      </section>
      <section className={styles.section}><span className={styles.kicker}>DE LIMA A TU CIUDAD</span><h2>Así coordinamos tu compra</h2><div className={styles.steps}><article><b>01</b><h3>Cuéntanos qué buscas</h3><p>Indica equipo, ciudad y distrito de destino.</p></article><article><b>02</b><h3>Recibe tu cotización</h3><p>Recibe por WhatsApp el precio final, la versión del equipo, la forma de pago y el costo y plazo del envío por Shalom.</p></article><article><b>03</b><h3>Confirma antes de pagar</h3><p>Revisa las condiciones con el asesor. La consulta no reserva el equipo ni confirma una venta.</p></article></div></section>
      <section id="cotizar" className={styles.quote}><span className={styles.kicker}>ASESORÍA PERSONALIZADA</span><h2>Cotiza para tu provincia</h2><p>Te ayudamos a elegir y confirmar si podemos entregar en tu destino.</p><ProvinceQuote products={items.map(p => ({id:p.id,name:p.name}))}/></section>
      <section className={styles.section}><h2>Antes de comprar</h2><details><summary>¿Cuánto cuesta y cuánto demora el envío?</summary><p>Enviamos por Shalom. El asesor confirma cobertura para tu destino, modalidad, costo y plazo antes del pago. <a href="/envios">Ver información de envíos.</a></p></details><details><summary>¿Qué garantía tiene mi celular?</summary><p>Los equipos de esta selección tienen garantía de un año. El asesor informa la cobertura y el procedimiento de atención antes de comprar. <a href="/garantia">Ver información de garantía.</a></p></details><details><summary>¿Cómo obtengo el precio final?</summary><p>Solicita tu cotización por WhatsApp. Te informaremos el precio final del equipo y el costo de envío por Shalom antes de pagar.</p></details></section>
    </main><footer className={styles.footer}><strong>Busca el tuyo aquí, en Tienda Móvil.</strong><p>WhatsApp: +51 953 587 927</p><nav><a href="/">Tienda</a><a href="/envios">Envíos</a><a href="/garantia">Garantía</a><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></nav></footer><AnalyticsConsent/>
  </div>;
}
