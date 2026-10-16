'use client';
import { useEffect, useRef, useState } from 'react';
import styles from '../app/ofertas-provincia/provincia.module.css';

export default function ProvinceQuote({ products }) {
  const [product, setProduct] = useState(products[0]?.name || 'Quiero una recomendación');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [verification, setVerification] = useState(null);
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
    if (submitting.current || submitted) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    if (!name || !/^([+]?51 ?)?9[0-9]{8}$/.test(phone) || !city.trim()) return;
    submitting.current = true;
    setSaving(true);
    const price = selected?.priceVerified ? 'Precio del equipo: S/ ' + selected.price + '. Envío aparte.\n' : '';
    const message = 'Hola Tienda Móvil. Quiero cotizar un celular con envío a provincia.\nNombre: ' + name + '\nTeléfono: ' + phone + '\nEquipo: ' + product + '\n' + price + 'Ciudad / provincia: ' + city.trim() + '\nPor favor confirmen versión, stock, garantía, forma de pago, costo y plazo de envío por Shalom.';
    const isTest = /^PRUEBA NO CONTACTAR\b/i.test(name) && phone === '999999999';
    const leadId = crypto.randomUUID();
    const whatsappUrl = 'https://wa.me/51953587927?text=' + encodeURIComponent(message);
    // Open within the submit gesture; slow saving must not block the conversation.
    if (!isTest) window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    let attrs = {};
    try { attrs = JSON.parse(localStorage.getItem('tnm_attribution') || '{}'); } catch {}
    const payload = {
      ...(isTest ? {} : attrs), name, phone,
      interest: product + ' | Destino: ' + city.trim(),
      budget: selected?.priceVerified ? 'Equipo S/ ' + selected.price + '; envío aparte' : 'Por definir',
      source: isTest ? 'verification_test' : 'province_quote',
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
      window.dispatchEvent(new CustomEvent('tnm-lead-saved', {detail:{event_label:'province_quote',method:'WhatsApp',lead_id:leadId,test_mode:isTest}}));
      setSubmitted(true);
      if (isTest) setVerification({ leadId, destination: '51953587927', saved: true });
      setStatus(isTest ? 'PRUEBA guardada. WhatsApp no se abrió y no se envió conversión publicitaria.' : 'Solicitud guardada. Envía el mensaje en WhatsApp para hablar con el asesor.');
    } else {
      setSubmitted(true);
      setStatus('No pudimos confirmar el guardado. Para evitar duplicados no repetiremos el envío automáticamente. Contacta al asesor por WhatsApp.');
    }
    // Keep the synchronous guard locked after an attempted non-idempotent write.
    setSaving(false);
  };
  return <div id="contacto" className={styles.formWrap}><form className={styles.form} onSubmit={submit} data-lead-capture="managed">
    <label>Nombre<input name="name" autoComplete="name" required maxLength={120}/></label>
    <label>Celular peruano<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required pattern="([+]?51 ?)?9[0-9]{8}" placeholder="Ej. 953587927" title="Ingresa 9 dígitos empezando en 9, con +51 opcional."/></label>
    <label>Ciudad / provincia<input name="city" value={city} onChange={e => setCity(e.target.value)} required maxLength={80} autoComplete="address-level2"/></label>
    <label>Equipo<select value={product} onChange={e => setProduct(e.target.value)}>{products.map(p => <option key={p.id}>{p.name}</option>)}<option>Quiero una recomendación</option></select></label>
    {selected?.priceVerified && <p className={styles.formNote}>Precio del equipo: {new Intl.NumberFormat('es-PE', {style:'currency',currency:'PEN',maximumFractionDigits:0}).format(selected.price)}. Envío aparte según destino. Confirma stock y entrega con el asesor.</p>}
    <p className={styles.formNote}>Solo necesitamos tu nombre, celular y ciudad. Coordinamos distrito y entrega por WhatsApp. Usaremos estos datos para atender tu solicitud. <a href="/privacidad">Política de privacidad.</a></p>
    <button className={styles.primary} type="submit" disabled={saving || submitted}>{saving ? 'Guardando solicitud…' : submitted ? 'Solicitud enviada' : 'Cotizar por WhatsApp →'}</button>
    <p role="status" data-testid="lead-status" data-saved={verification?.saved ? "true" : undefined} data-lead-id={verification?.leadId} data-whatsapp-destination={verification?.destination} className={styles.formNote}>{status}</p>
  </form></div>;
}
