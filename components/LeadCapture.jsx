'use client';

import { useEffect } from 'react';

function getAttribution() {
  try {
    return JSON.parse(localStorage.getItem('tnm_attribution') || '{}');
  } catch {
    return {};
  }
}

export default function LeadCapture() {
  useEffect(() => {
    const onSubmit = (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (!form.closest('#contacto')) return;

      const data = new FormData(form);
      const payload = {
        name: String(data.get('name') || '').trim().slice(0, 120),
        phone: String(data.get('phone') || '').trim().slice(0, 40),
        interest: String(data.get('interest') || '').trim().slice(0, 180),
        budget: String(data.get('budget') || '').trim().slice(0, 100),
        path: window.location.pathname,
        page_url: window.location.href.slice(0, 500),
        referrer: document.referrer.slice(0, 500),
        ...getAttribution()
      };

      if (!payload.name || !payload.phone) return;

      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    };

    document.addEventListener('submit', onSubmit, true);
    return () => document.removeEventListener('submit', onSubmit, true);
  }, []);

  return null;
}
