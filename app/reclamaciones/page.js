import ComplaintForm from '../../components/ComplaintForm';
import './reclamaciones.css';
export const metadata = { title: 'Reclamaciones y quejas', description: 'Canal de atención de reclamos y quejas de Tiendanovamovil.', alternates: { canonical: '/reclamaciones' } };
export default function Page() {
  return <main className="legalPage complaintsPage">
    <section className="legalHero"><a href="/">← Volver a la tienda</a><h1>Reclamaciones y quejas</h1><p>Queremos escucharte y ayudarte a resolver cualquier inconveniente con tu compra o atención.</p></section>
    <section className="legalContent">
      <article className="legalCard"><h2>Tu solicitud merece atención</h2><p><strong>Reclamo:</strong> disconformidad relacionada con un producto o servicio. <strong>Queja:</strong> malestar relacionado con la atención al público.</p><p>La atención es gratuita. Responderemos por escrito al correo que indiques en un plazo máximo de <strong>15 días hábiles, improrrogables</strong>.</p><p>Este canal recibe solicitudes de atención. La identificación legal del proveedor y la habilitación del Libro de Reclamaciones formal están pendientes de completar.</p></article>
      <ComplaintForm/>
      <article className="legalCard"><h2>Información para el consumidor</h2><p>La presentación de tu reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para presentar una denuncia ante Indecopi.</p><p>Si tienes dificultades con el formulario, comunícate al <a href="tel:+51935748390">+51 935 748 390</a>. <a href="https://www.gob.pe/532-presentar-quejas-y-o-reclamos-en-indecopi" target="_blank" rel="noopener noreferrer">Conoce los canales de Indecopi</a>.</p></article>
    </section>
  </main>;
}
