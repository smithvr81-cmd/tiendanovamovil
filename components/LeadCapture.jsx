'use client';

import { useEffect } from 'react';

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
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+') && digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  if (digits.startsWith('51') && digits.length === 11) return `+${digits}`;
  if (digits.length === 9) return `+51${digits}`;
  return '';
}

function setGoogleUserData(phone) {
  const phoneNumber = normalizePeruPhone(phone);
  if (!phoneNumber || typeof window.gtag !== 'function') return;
  window.gtag('set', 'user_data', { phone_number: phoneNumber });
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'user_data_ready', user_data: { phone_number: phoneNumber } });
}

export default function LeadCapture() {
  useEffect(() => {
    const onSubmit = (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (!form.closest('#contacto')) return;

      const data = new FormData(form);
      const phone = String(data.get('phone') || '').trim().slice(0, 40);
      const payload = {
        name: String(data.get('name') || '').trim().slice(0, 120),
        phone,
        interest: String(data.get('interest') || '').trim().slice(0, 180),
        budget: String(data.get('budget') || '').trim().slice(0, 100),
        path: window.location.pathname,
        page_url: window.location.href.slice(0, 500),
        referrer: document.referrer.slice(0, 500),
        ...getAttribution()
      };

      if (!payload.name || !payload.phone) return;

      setGoogleUserData(phone);

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
