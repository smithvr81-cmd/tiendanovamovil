'use client';
import { useEffect, useState } from 'react';
import styles from '../app/ofertas-provincia/provincia.module.css';

export default function ProvinceQuote({ products }) {
  const [product, setProduct] = useState(products[0].name);
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => {
    const selectFromHash = () => {
      const match = products.find(p => window.location.hash === '#cotizar-' + p.id);
      if (match) { setProduct(match.name); document.getElementById('cotizar')?.scrollIntoView({behavior:'smooth'}); }
    };
    selectFromHash();
    window.addEventListener('hashchange', selectFromHash);
    return () => window.removeEventListener('hashchange', selectFromHash);
  }, [products]);
  const submit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = 'Hola Tienda Móvil. Quiero cotizar un celular con envío a provincia.\nNombre: ' + data.get('name') + '\nTeléfono: ' + data.get('phone') + '\nEquipo: ' + product + '\nCiudad / provincia: ' + city.trim() + '\nDistrito: ' + district.trim() + '\nPresupuesto: ' + data.get('budget') + '\nPor favor confirmen versión, stock en Lima, precio final, garantía, forma de pago, transportista, costo y plazo de envío.';
    window.gtag?.('event', 'purchase_form_submit', {event_label:'province_quote', currency:'PEN'});
    window.open('https://wa.me/51953587927?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
    setStatus('Se solicitó abrir WhatsApp. Envía allí el mensaje para conversar con el asesor.');
  };
  return <div id="contacto" className={styles.formWrap}><form className={styles.form} onSubmit={submit}>
    <label>Nombre<input name="name" autoComplete="name" required maxLength={120}/></label>
    <label>Celular peruano<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required pattern="([+]?51 ?)?9[0-9]{8}" placeholder="Ej. 953587927" title="Ingresa 9 dígitos empezando en 9, con +51 opcional."/></label>
    <label>Equipo<select value={product} onChange={e => setProduct(e.target.value)}>{products.map(p => <option key={p.id}>{p.name}</option>)}<option>Quiero una recomendación</option></select></label>
    <label>Ciudad / provincia<input value={city} onChange={e => setCity(e.target.value)} required maxLength={80} autoComplete="address-level2"/></label>
    <label>Distrito<input value={district} onChange={e => setDistrict(e.target.value)} required maxLength={80}/></label>
    <label>Presupuesto<select name="budget"><option>Hasta S/ 1,000</option><option>S/ 1,000 a S/ 1,500</option><option>S/ 1,500 a S/ 2,000</option><option>Más de S/ 2,000</option></select></label>
    <input type="hidden" name="interest" value={product + ' | Destino: ' + city + ', ' + district}/>
    <p className={styles.formNote}>Usaremos tu nombre, teléfono y destino para atender esta solicitud. <a href="/privacidad">Consulta la política de privacidad.</a></p>
    <button className={styles.primary} type="submit">Consultar por WhatsApp →</button>
    <p role="status" className={styles.formNote}>{status}</p>
  </form></div>;
}
