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
  const [whatsappLink, setWhatsappLink] = useState('');
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
    const phone = String(data.get('phone') || '').replace(/[\s()\-]/g, '');
    const phoneInput = event.currentTarget.elements?.namedItem('phone');
    if (!/^([+]?51)?9[0-9]{8}$/.test(phone)) {
      phoneInput?.setCustomValidity('Ingresa un celular peruano de 9 dígitos empezando en 9. Puedes incluir +51, espacios o guiones.');
      phoneInput?.reportValidity();
      setStatus('Revisa tu número de celular para continuar.');
      return;
    }
    phoneInput?.setCustomValidity('');
    if (!name || !city.trim() || /\[ciudad\]/i.test(city) || !product.trim()) {
      setStatus('Completa tu nombre y ciudad para continuar.');
      return;
    }
    submitting.current = true;
    setSaving(true);
    const price = selected?.priceVerified ? 'Precio del equipo: S/ ' + selected.price + '. Envío aparte.\n' : '';
    const message = 'Hola Tienda Móvil. Quiero cotizar un celular con envío a provincia.\nNombre: ' + name + '\nTeléfono: ' + phone + '\nEquipo: ' + product + '\n' + price + 'Ciudad / provincia: ' + city.trim() + '\nPor favor confirmen versión, stock, garantía, forma de pago, costo y plazo de envío por Shalom.';
    const isTest = /^PRUEBA NO CONTACTAR\b/i.test(name) && phone === '999999999';
    const leadId = crypto.randomUUID();
    const whatsappUrl = 'https://wa.me/51935748390?text=' + encodeURIComponent(message);
    let attrs = {};
    try { attrs = JSON.parse(localStorage.getItem('tnm_attribution') || '{}'); } catch {}
    const payload = {
      ...(isTest ? {} : attrs), name, phone, lead_id: leadId,
      interest: product + ' | Destino: ' + city.trim(),
      budget: selected?.priceVerified ? 'Equipo S/ ' + selected.price + '; envío aparte' : 'Por definir',
      source: isTest ? 'verification_test' : 'province_quote',
      page_url: window.location.href,
      submitted_at: new Date().toISOString()
    };
    let saved = false;
    let duplicate = false;
    let rejectedBeforeWrite = false;
    try {
      const response = await fetch('/api/leads', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload), keepalive: true
      });
      const result = await response.json();
      duplicate = result.duplicate === true;
      rejectedBeforeWrite = response.status === 400 && ['missing_required_fields', 'invalid_phone', 'missing_city_or_interest'].includes(result.error);
      saved = response.ok && result.ok === true && result.saved === true;
    } catch {}
    if (saved) {
      if (!duplicate) window.dispatchEvent(new CustomEvent('tnm-lead-saved', {detail:{event_label:'province_quote',method:'WhatsApp',lead_id:leadId,test_mode:isTest}}));
      if (!isTest) {
        setWhatsappLink(whatsappUrl);
        // A manual link remains available if the browser blocks this delayed popup.
        window.dispatchEvent(new CustomEvent('tnm-whatsapp-ready', { detail: {} }));
        try { window.open(whatsappUrl, '_blank', 'noopener,noreferrer'); } catch {}
      }
      setSubmitted(true);
      if (isTest) setVerification({ leadId, destination: '51935748390', saved: true });
      setStatus(isTest ? 'PRUEBA guardada. WhatsApp no se abrió y no se envió conversión publicitaria.' : '1. Solicitud guardada. 2. En WhatsApp, toca Enviar para hablar con el asesor. Si no se abrió, usa el enlace de abajo.');
    } else if (rejectedBeforeWrite) {
      setSubmitted(false);
      submitting.current = false;
      setStatus('Revisa tu nombre, celular, ciudad y equipo. No se guardó la solicitud; puedes corregir los datos y volver a enviar.');
    } else {
      setSubmitted(true);
      setStatus('No pudimos confirmar el guardado. Para evitar duplicados no repetiremos el envío automáticamente. Tus datos siguen en el formulario. El guardado queda pendiente; no abrimos WhatsApp.');
    }
    // Keep the synchronous guard locked after an attempted non-idempotent write.
    setSaving(false);
  };
  return <div id="contacto" className={styles.formWrap}><form className={styles.form} onSubmit={submit} data-lead-capture="managed">
    <label>Nombre<input name="name" autoComplete="name" required maxLength={120}/></label>
    <label>Celular peruano<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={30} onChange={event => event.currentTarget.setCustomValidity('')} placeholder="Ej. 935 748 390" aria-describedby="phone-help"/></label>
    <label>Ciudad / provincia<input name="city" value={city} onChange={e => setCity(e.target.value)} required maxLength={80} autoComplete="address-level2"/></label>
    <label>Equipo<select value={product} onChange={e => setProduct(e.target.value)}>{products.map(p => <option key={p.id}>{p.name}</option>)}<option>Quiero una recomendación</option></select></label>
    <p id="phone-help" className={styles.formNote}>Puedes escribir tu celular con +51, espacios o guiones.</p>
    {selected?.priceVerified && <p className={styles.formNote}>Precio del equipo: {new Intl.NumberFormat('es-PE', {style:'currency',currency:'PEN',maximumFractionDigits:0}).format(selected.price)}. Envío aparte según destino. Confirma stock y entrega con el asesor.</p>}
    <p className={styles.formNote}>Solo necesitamos tu nombre, celular y ciudad. Coordinamos distrito y entrega por WhatsApp. Usaremos estos datos para atender tu solicitud. <a href="/privacidad">Política de privacidad.</a></p>
    <p className={styles.formNote}>1. Completa y guarda tu solicitud. 2. En WhatsApp, toca Enviar. Abrir WhatsApp no envía el mensaje automáticamente.</p>
    <button className={styles.primary} type="submit" disabled={saving || submitted}>{saving ? 'Guardando solicitud…' : submitted ? (whatsappLink || verification?.saved ? 'Solicitud guardada' : 'Guardado no confirmado') : 'Guardar y abrir WhatsApp →'}</button>
    <p role="status" data-testid="lead-status" data-saved={verification?.saved ? "true" : undefined} data-lead-id={verification?.leadId} data-whatsapp-destination={verification?.destination} className={styles.formNote}>{status}</p>
    {submitted && whatsappLink && <a className={`${styles.primary} ${styles.whatsappFallback}`} data-lead-capture="continuation" href={whatsappLink} target="_blank" rel="noopener noreferrer">Abrir WhatsApp y enviar mi mensaje →</a>}
  </form></div>;
}

