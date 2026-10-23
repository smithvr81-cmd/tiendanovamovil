'use client';

import { useEffect, useRef, useState } from 'react';
import { submitLeadOnce, suggestedInterest, cartInquiryContext } from '../lib/leadSubmission.mjs';


function isWhatsAppUrl(value) {
  const href = String(value || '');
  return href.includes('wa.me/') || href.includes('whatsapp.com/');
}

function getAttribution() {
  try {
    return JSON.parse(localStorage.getItem('tnm_attribution') || '{}');
  } catch {
    return {};
  }
}

function normalizePeruPhone(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (!/^[+0-9\s()\-]+$/.test(raw)) return '';
  const digits = raw.replace(/\D/g, '');
  if (/^519[0-9]{8}$/.test(digits)) return `+${digits}`;
  if (/^9[0-9]{8}$/.test(digits)) return `+51${digits}`;
  return '';
}

function setGoogleUserData(phone) {
  const phoneNumber = normalizePeruPhone(phone);
  if (!phoneNumber || typeof window.gtag !== 'function') return;
  window.gtag('set', 'user_data', { phone_number: phoneNumber });
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'user_data_ready', user_data: { phone_number: phoneNumber } });
}


function parseWhatsappMessage(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.searchParams.get('text') || '';
  } catch {
    return '';
  }
}

export default function WhatsAppLeadGate() {
  const [pendingUrl, setPendingUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [continuationUrl, setContinuationUrl] = useState('');
  const originalOpenRef = useRef(null);
  const allowUntilRef = useRef(0);
  const submitting = useRef(false);

  useEffect(() => {
    // Keep historical pending entries intact; do not replay non-idempotent writes.

    const originalOpen = window.open.bind(window);
    originalOpenRef.current = originalOpen;

    const openGate = (url) => {
      if (submitting.current) return;
      setContinuationUrl('');
      setPendingUrl(String(url || ''));
      setStatus('idle');
      setError('');
    };

    const onClick = (event) => {
      const link = event.target.closest?.('a[href*="wa.me"],a[href*="whatsapp.com"]');
      if (!link) return;
      // This form already attempted its one non-idempotent write. Never capture it again.
      if (link.dataset.leadCapture === 'continuation' && link.closest('form[data-lead-capture="managed"],form[data-lead-saved="true"]')) return;
      if (Date.now() < allowUntilRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      openGate(link.href);
    };

    const onReady = () => { allowUntilRef.current = Date.now() + 2500; };

    document.addEventListener('click', onClick, true);
    window.addEventListener('tnm-whatsapp-ready', onReady);

    window.open = function gatedOpen(url, ...args) {
      const href = String(url || '');
      if (isWhatsAppUrl(href) && Date.now() >= allowUntilRef.current) {
        openGate(href);
        return null;
      }
      return originalOpen(url, ...args);
    };

    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('tnm-whatsapp-ready', onReady);
      window.open = originalOpen;
    };
  }, []);

  const close = () => {
    if (submitting.current) return;
    setPendingUrl('');
    setError('');
    setStatus('idle');
  };

  const continueToWhatsApp = (url, normalizedPhone, saved = false, lead_id) => {
    setGoogleUserData(normalizedPhone);

    if (saved) {
      window.dispatchEvent(new CustomEvent('tnm-lead-saved', { detail: { event_label: 'whatsapp_lead_gate', method: 'WhatsApp', lead_id } }));
    }

    allowUntilRef.current = Date.now() + 3000;
    setStatus('saved');
    setContinuationUrl(url);
    try { originalOpenRef.current?.(url, '_blank', 'noopener,noreferrer'); } catch {}
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!pendingUrl || submitting.current || continuationUrl) return;

    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const city = String(data.get('city') || '').trim();
    const interest = String(data.get('interest') || '').trim();
    const budget = String(data.get('budget') || '').trim();
    if (!name || !phone || !city || !interest) {
      setError('Completa tu nombre, teléfono, ciudad y modelo o necesidad.');
      return;
    }

    const normalizedPhone = normalizePeruPhone(phone);
    if (!normalizedPhone) {
      setStatus('error');
      setError('Ingresa un teléfono peruano válido de 9 dígitos.');
      return;
    }

    const message = parseWhatsappMessage(pendingUrl);
    const attrs = getAttribution();
    const payload = {
      ...attrs,
      name,
      phone: normalizedPhone,
      interest: interest + (cartInquiryContext(message) ? ' | Pedido: ' + cartInquiryContext(message) : '') + ' | Destino: ' + city,
      budget: budget || 'Por definir',
      source: 'whatsapp_gate',
      page_url: window.location.href,
      referrer: document.referrer,
      submitted_at: new Date().toISOString()
    };

    const destination = new URL(pendingUrl, window.location.href);
    destination.searchParams.set('text', message.replaceAll('[ciudad]', city) + '\nNombre: ' + name + '\nTeléfono: ' + normalizedPhone + '\nCiudad / provincia: ' + city + '\nModelo / necesidad: ' + interest + (budget ? '\nPresupuesto: ' + budget : ''));
    const url = destination.toString();
    submitting.current = true;
    setStatus('saving');
    setError('');

    try {
      const result = await submitLeadOnce(payload);
      if (!result.saved) {
        setStatus('error');
        setError('No pudimos confirmar el guardado. Tus datos siguen aquí. No repetiremos este envío para evitar duplicados; intenta más tarde o consulta al asesor indicando que el guardado quedó pendiente.');
        return;
      }
      continueToWhatsApp(url, normalizedPhone, !result.duplicate, result.lead_id);
    } catch {
      setStatus('error');
      setError('No pudimos confirmar el guardado. Conservamos tus datos; no abrimos WhatsApp ni repetimos el envío.');
    } finally {
      submitting.current = false;
    }
  };

  if (!pendingUrl) return null;

  return (
    <div className="leadGateBackdrop" role="dialog" aria-modal="true" aria-labelledby="lead-gate-title" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="leadGateCard">
        <button className="leadGateClose" type="button" onClick={close} aria-label="Cerrar">×</button>
        <span className="leadGateEyebrow">ATENCIÓN POR WHATSAPP</span>
        <h2 id="lead-gate-title">Antes de continuar</h2>
        <p>Déjanos tus datos, ciudad y el equipo o la ayuda que necesitas. Guardaremos tu solicitud para que un asesor pueda darte seguimiento y luego abriremos WhatsApp.</p>
        <form onSubmit={submit} key={pendingUrl} data-lead-capture="managed">
          <label>Nombre<input name="name" autoComplete="name" required maxLength="120" placeholder="Tu nombre" /></label>
          <label>Teléfono<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength="40" placeholder="Ej. 999 999 999" /></label>
          <label>Ciudad / provincia<input name="city" autoComplete="address-level2" required maxLength="80" placeholder="¿Dónde recibirías tu pedido?" /></label>
          <label>Modelo o necesidad<input name="interest" required maxLength="100" list="lead-gate-needs" defaultValue={suggestedInterest(parseWhatsappMessage(pendingUrl))} placeholder="Modelo o Quiero una recomendación" /></label>
          <datalist id="lead-gate-needs"><option value="Quiero una recomendación" /></datalist>
          <label>Presupuesto (opcional)<input name="budget" maxLength="100" placeholder="Por definir" /></label>
          {error && <div className="leadGateError" role="alert">{error}</div>}
          <button type="submit" disabled={status === 'saving' || !!continuationUrl}>{status === 'saving' ? 'Guardando...' : continuationUrl ? 'Solicitud procesada' : 'Continuar a WhatsApp'}</button>
          {continuationUrl && <p role="status">En WhatsApp, toca Enviar para hablar con el asesor. <a data-lead-capture="continuation" href={continuationUrl} target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a></p>}
          <small>Usaremos tus datos únicamente para responder tu solicitud comercial y medir conversiones publicitarias conforme a tu consentimiento.</small>
        </form>
      </div>
      <style jsx>{`
        .leadGateBackdrop{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;background:rgba(2,8,18,.78);backdrop-filter:blur(8px)}
        .leadGateCard{position:relative;width:min(480px,100%);max-height:90dvh;overflow-y:auto;padding:30px;border:1px solid rgba(255,255,255,.14);border-radius:22px;background:#0d1a2c;color:#fff;box-shadow:0 25px 80px rgba(0,0,0,.45)}
        .leadGateClose{position:absolute;right:16px;top:12px;border:0;background:transparent;color:#aab5c4;font-size:30px;cursor:pointer}
        .leadGateEyebrow{font-size:11px;font-weight:800;letter-spacing:.16em;color:#ff9b57}
        h2{margin:10px 0 10px;font-size:32px;letter-spacing:-.03em}
        p{margin:0 0 22px;color:#aab5c4;line-height:1.6;font-size:14px}
        form{display:grid;gap:14px}
        label{display:grid;gap:7px;font-size:12px;font-weight:700;color:#dce3ec}
        input{width:100%;padding:13px 14px;border:1px solid rgba(255,255,255,.14);border-radius:10px;background:#091728;color:#fff;outline:0;font:inherit}
        input:focus{border-color:#ff7417;box-shadow:0 0 0 3px rgba(255,116,23,.12)}
        form>button{margin-top:4px;padding:14px 16px;border:0;border-radius:10px;background:#20b85a;color:#fff;font-weight:800;cursor:pointer}
        form>button:disabled{opacity:.65;cursor:wait}
        small{text-align:center;color:#7e899a;font-size:10px;line-height:1.5}
        .leadGateError{padding:10px 12px;border-radius:9px;background:rgba(220,38,38,.14);color:#fecaca;font-size:12px;line-height:1.5}
      `}</style>
    </div>
  );
}


