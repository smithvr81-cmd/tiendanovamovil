import Image from 'next/image';
import ProvinceQuote from '../../components/ProvinceQuote';
import AnalyticsConsent from '../../components/AnalyticsConsent';
import styles from '../ofertas-provincia/provincia.module.css';

export const metadata = {
  title: 'Samsung A16 128GB | Consulta aquí',
  description: 'Consulta por el Samsung A16 de 128GB con garantía de 1 año en Tienda Móvil. Confirma disponibilidad, colores y envío a tu provincia por WhatsApp.',
  alternates: { canonical: '/samsung-a16-128gb' }
};

// Seller confirmed A16 and 128GB. Technical details below are shared by Samsung's LTE and 5G models.
// RAM, processor and connectivity are not yet specified for the seller's unit.
const samsung = {
  id: 'samsung-a16-128gb',
  name: 'Samsung A16 128GB',
  priceVerified: false
};

export default function SamsungA16Offer() {
  return <div className={styles.page}>
    <a className={styles.skip} href="#cotizar">Ir a la consulta</a>
    <header className={styles.header}>
      <a href="/" aria-label="Volver a Tienda Móvil"><Image src="/logo-tiendanovamovil.png" alt="" width={44} height={44} unoptimized /> <strong>Tienda Móvil</strong></a>
      <a href="#cotizar">Consulta aquí</a>
    </header>
    <main>
      <section className={styles.hero}>
        <span className={styles.kicker}>SAMSUNG · ATENCIÓN PARA PROVINCIAS</span>
        <h1>Samsung A16<br/><em>128GB</em></h1>
        <p>128GB de almacenamiento y garantía de 1 año. Consulta la disponibilidad, los colores y el envío a tu ciudad. Te confirmamos los detalles de tu equipo por WhatsApp antes de comprar.</p>
        <a className={styles.primary} href="#cotizar">Consulta aquí</a>
        <div className={styles.benefits}><span>✓ 128GB de almacenamiento</span><span>✓ Garantía de 1 año</span><span>✓ Atención por WhatsApp</span></div>
      </section>
      <section id="cotizar" className={styles.quote}>
        <span className={styles.kicker}>ASESORÍA PERSONALIZADA</span>
        <h2>Consulta por tu Samsung A16</h2>
        <p>Déjanos tu nombre, celular y ciudad. El Samsung A16 de 128GB ya está seleccionado.</p>
        <ProvinceQuote products={[samsung]}/>
      </section>
      <section className={styles.section}>
        <span className={styles.kicker}>CARACTERÍSTICAS DEL GALAXY A16</span>
        <h2>Conoce sus detalles</h2>
        <div className={styles.steps}>
          <article><h3>Pantalla Super AMOLED</h3><p>6.7 pulgadas con resolución FHD+. Medida en diagonal como rectángulo completo; el área visible es menor por las esquinas y la cámara.</p></article>
          <article><h3>Cámaras para cada momento</h3><p>Cámara principal de 50MP, ultra gran angular de 5MP y macro de 2MP. Cámara frontal de 13MP.</p></article>
          <article><h3>128GB de almacenamiento</h3><p>Capacidad confirmada para esta oferta. Consulta la memoria RAM y la conectividad de la unidad disponible.</p></article>
          <article><h3>Batería de 5000mAh</h3><p>Capacidad típica. Compatible con carga rápida de hasta 25W. Confirma el cargador y los accesorios incluidos antes de comprar.</p></article>
          <article><h3>Diseño de 7.9mm</h3><p>164.4 × 77.9 × 7.9mm y 200g. Resistencia IP54 al polvo y a salpicaduras; no es para sumergir ni usar en piscinas.</p></article>
          <article><h3>Garantía de 1 año</h3><p>Consulta con nuestro asesor la cobertura, el procedimiento de atención y las condiciones de entrega.</p></article>
        </div>
        <p className={styles.formNote}>Los datos técnicos mostrados son comunes a las versiones Galaxy A16 LTE y 5G publicadas por <a href="https://news.samsung.com/pe/los-samsung-galaxy-a16-y-a16-5g-llegan-con-hasta-seis-actualizaciones-del-sistema-android-y-seguridad" target="_blank" rel="noopener noreferrer">Samsung Perú</a>. Confirma la versión exacta, procesador y memoria RAM antes de comprar.</p>
      </section>
      <section className={styles.section} aria-labelledby="video-samsung">
        <h2 id="video-samsung">Conoce el Samsung A16</h2>
        <div className={styles.media} style={{ maxWidth: '360px', aspectRatio: '9 / 16', maxHeight: '640px', borderRadius: '18px', overflow: 'hidden' }}>
          <iframe src="https://www.youtube-nocookie.com/embed/FzHZNz-v-bE" title="Video de Samsung A16 128GB de Tienda Móvil" loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
        </div>
      </section>
      <section className={styles.section}>
        <span className={styles.kicker}>DE LIMA A TU CIUDAD</span>
        <h2>Así coordinamos tu compra</h2>
        <div className={styles.steps}>
          <article><b>01</b><h3>Cuéntanos tu destino</h3><p>Indica tu ciudad o provincia para consultar por el Samsung A16 de 128GB.</p></article>
          <article><b>02</b><h3>Confirma tu equipo</h3><p>Por WhatsApp revisamos la versión, memoria RAM, conectividad, colores disponibles y condiciones de garantía.</p></article>
          <article><b>03</b><h3>Coordina tu entrega</h3><p>El asesor confirma cobertura, costo y plazo de envío por Shalom antes del pago. La consulta no reserva el equipo ni confirma una venta.</p></article>
        </div>
      </section>
      <section className={styles.section}>
        <h2>Antes de comprar</h2>
        <details><summary>¿Qué incluye la garantía?</summary><p>El Samsung A16 de esta oferta tiene garantía de 1 año. Consulta la cobertura y el procedimiento de atención antes de comprar. <a href="/garantia">Ver información de garantía.</a></p></details>
        <details><summary>¿Cómo coordinamos el envío?</summary><p>Enviamos por Shalom. El asesor confirma cobertura para tu destino, modalidad, costo y plazo antes del pago. <a href="/envios">Ver información de envíos.</a></p></details>
        <details><summary>¿Cómo confirmo la versión y los colores?</summary><p>Consulta por WhatsApp la versión exacta del Samsung A16 de 128GB, su memoria RAM, conectividad y los colores disponibles.</p></details>
      </section>
    </main>
    <footer className={styles.footer}>
      <strong>Samsung A16 128GB en Tienda Móvil.</strong>
      <p>WhatsApp: +51 935 748 390</p>
      <nav><a href="/">Tienda</a><a href="/envios">Envíos</a><a href="/garantia">Garantía</a><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></nav>
    </footer>
    <AnalyticsConsent/>
  </div>;
}
