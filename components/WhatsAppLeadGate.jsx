'use client';

import { useEffect, useRef, useState } from 'react';

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

function parseWhatsappMessage(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return decodeURIComponent(parsed.searchParams.get('text') || '').slice(0, 1000);
  } catch {
    return '';
  }
}

export default function WhatsAppLeadGate() {
  const [pendingUrl, setPendingUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const originalOpenRef = useRef(null);
  const allowUntilRef = useRef(0);

  useEffect(() => {
    const originalOpen = window.open.bind(window);
    originalOpenRef.current = originalOpen;

    const openGate = (url) => {
      setPendingUrl(String(url || ''));
      setStatus('idle');
      setError('');
    };

    const onClick = (event) => {
      const link = event.target.closest?.('a[href*="wa.me"],a[href*="whatsapp.com"]');
      if (!link) return;
      if (Date.now() < allowUntilRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      openGate(link.href);
    };

    const onSubmit = (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.closest('#contacto')) allowUntilRef.current = Date.now() + 2500;
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);

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
      document.removeEventListener('submit', onSubmit, true);
      window.open = originalOpen;
    };
  }, []);

  const close = () => {
    if (status === 'saving') return;
    setPendingUrl('');
    setError('');
    setStatus('idle');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!pendingUrl || status === 'saving') return;

    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    if (!name || !phone) return;

    const message = parseWhatsappMessage(pendingUrl);
    const attrs = getAttribution();
    const payload = {
      name,
      phone,
      interest: message || 'Contacto por WhatsApp',
      budget: 'Por definir',
      source: 'whatsapp_gate',
      page_url: window.location.href,
      referrer: document.referrer,
      ...attrs
    };

    setStatus('saving');
    setError('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error('save_failed');

      if (typeof window.gtag === 'function') {
        window.gtag('event', 'purchase_form_submit', {
          event_category: 'conversion',
          event_label: 'whatsapp_lead_gate',
          method: 'WhatsApp'
        });
      }

      allowUntilRef.current = Date.now() + 3000;
      const url = pendingUrl;
      setStatus('saved');
      setPendingUrl('');
      originalOpenRef.current?.(url, '_blank', 'noopener,noreferrer');
    } catch {
      setStatus('error');
      setError('No pudimos guardar tus datos. Intenta nuevamente para continuar a WhatsApp.');
    }
  };

  if (!pendingUrl) return null;

  return (
    <div className="leadGateBackdrop" role="dialog" aria-modal="true" aria-labelledby="lead-gate-title" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="leadGateCard">
        <button className="leadGateClose" type="button" onClick={close} aria-label="Cerrar">×</button>
        <span className="leadGateEyebrow">ATENCIÓN POR WHATSAPP</span>
        <h2 id="lead-gate-title">Antes de continuar</h2>
        <p>Déjanos tu nombre y teléfono. Guardaremos tu solicitud para que un asesor pueda darte seguimiento y luego abriremos WhatsApp.</p>
        <form onSubmit={submit}>
          <label>Nombre<input name="name" autoComplete="name" required maxLength="120" placeholder="Tu nombre" /></label>
          <label>Teléfono<input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength="40" placeholder="Ej. 999 999 999" /></label>
          {error && <div className="leadGateError" role="alert">{error}</div>}
          <button type="submit" disabled={status === 'saving'}>{status === 'saving' ? 'Guardando...' : 'Continuar a WhatsApp'}</button>
          <small>Usaremos tus datos únicamente para responder tu solicitud comercial.</small>
        </form>
      </div>
      <style jsx>{`
        .leadGateBackdrop{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;background:rgba(2,8,18,.78);backdrop-filter:blur(8px)}
        .leadGateCard{position:relative;width:min(480px,100%);padding:30px;border:1px solid rgba(255,255,255,.14);border-radius:22px;background:#0d1a2c;color:#fff;box-shadow:0 25px 80px rgba(0,0,0,.45)}
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
