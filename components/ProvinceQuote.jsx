'use client';
import { useEffect, useRef, useState } from 'react';
import styles from '../app/ofertas-provincia/provincia.module.css';

export default function ProvinceQuote({ products }) {
  const [product, setProduct] = useState(products[0]?.name || 'Quiero una recomendación');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const selected = products.find(p => p.name === product);
  useEffect(() => {
    const selectFromHash = () => {
      const match = products.find(p => window.location.hash === '#cotizar-' + p.id);
      if (match) { setProduct(match.name); document.getElementById('cotizar')?.scrollIntoView({behavior:'smooth'}); }
    };
    selectFromHash();
    window.addEventListener('hashchange', selectFromHash);
    return () => window.removeEventListener('hashchange', selectFromHash);
  }, [products]);
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    if (!name || !/^([+]?51 ?)?9[0-9]{8}$/.test(phone) || !city.trim()) return;
    submitting.current = true;
    setSaving(true);
    const price = selected?.priceVerified ? 'Precio del equipo: S/ ' + selected.price + '. Envío aparte.\n' : '';
    const message = 'Hola Tienda Móvil. Quiero cotizar un celular con envío a provincia.\nNombre: ' + name + '\nTeléfono: ' + phone + '\nEquipo: ' + product + '\n' + price + 'Ciudad / provincia: ' + city.trim() + '\nPor favor confirmen versión, stock, garantía, forma de pago, costo y plazo de envío por Shalom.';
    const whatsappUrl = 'https://wa.me/51953587927?text=' + encodeURIComponent(message);
    // Open within the submit gesture; slow saving must not block the conversation.
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    let attrs = {};
    try { attrs = JSON.parse(localStorage.getItem('tnm_attribution') || '{}'); } catch {}
    const payload = {
      ...attrs, name, phone,
      interest: product + ' | Destino: ' + city.trim(),
      budget: selected?.priceVerified ? 'Equipo S/ ' + selected.price + '; envío aparte' : 'Por definir',
      source: 'province_quote',
      page_url: window.location.href,
      submitted_at: new Date().toISOString()
    };
    let saved = false;
    try {
      const response = await fetch('/api/leads', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload), keepalive: true
      });
      const result = await response.json();
      saved = response.ok && result.ok === true && result.saved === true;
    } catch {}
    if (saved) {
      window.dispatchEvent(new CustomEvent('tnm-lead-saved', {detail:{event_label:'province_quote',method:'WhatsApp'}}));
      setStatus('Solicitud guardada. Envía el mensaje en WhatsApp para hablar con el asesor.');
    } else {
      try {
        const pending = JSON.parse(localStorage.getItem('tnm_pending_leads') || '[]');
        localStorage.setItem('tnm_pending_leads', JSON.stringify([...(Array.isArray(pending) ? pending : []), payload].slice(-20)));
      } catch {}
      setStatus('El guardado está pendiente. Puedes enviar el mensaje en WhatsApp; reintentaremos guardar tu solicitud cuando vuelvas.');
    }
    submitting.current = false;
    setSaving(false);
  };
  return <div id="contacto" className={styles.formWrap}><form className={styles.form} onSubmit={submit}>
    <label>Nombre<input name="name" autoComplete="name" required maxLength={120}/></label>
    <label>Celular peruano<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required pattern="([+]?51 ?)?9[0-9]{8}" placeholder="Ej. 953587927" title="Ingresa 9 dígitos empezando en 9, con +51 opcional."/></label>
    <label>Ciudad / provincia<input name="city" value={city} onChange={e => setCity(e.target.value)} required maxLength={80} autoComplete="address-level2"/></label>
    <label>Equipo<select value={product} onChange={e => setProduct(e.target.value)}>{products.map(p => <option key={p.id}>{p.name}</option>)}<option>Quiero una recomendación</option></select></label>
    {selected?.priceVerified && <p className={styles.formNote}>Precio del equipo: {new Intl.NumberFormat('es-PE', {style:'currency',currency:'PEN',maximumFractionDigits:0}).format(selected.price)}. Envío aparte según destino. Confirma stock y entrega con el asesor.</p>}
    <p className={styles.formNote}>Solo necesitamos tu nombre, celular y ciudad. Coordinamos distrito y entrega por WhatsApp. Usaremos estos datos para atender tu solicitud. <a href="/privacidad">Política de privacidad.</a></p>
    <button className={styles.primary} type="submit" disabled={saving}>{saving ? 'Guardando solicitud…' : 'Cotizar por WhatsApp →'}</button>
    <p role="status" className={styles.formNote}>{status}</p>
  </form></div>;
}
