'use client';

import { useEffect } from 'react';
import { submitLeadOnce } from '../lib/leadSubmission.mjs';

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

export default function LeadCapture() {
  useEffect(() => {
    const pending = new WeakSet();
    const onSubmit = async (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (!form.closest('#contacto') || form.dataset.leadCapture === 'managed') return;

      // Own the complete form flow; never let the page open WhatsApp before save.
      event.preventDefault();
      event.stopImmediatePropagation();
      if (pending.has(form)) return;
      const data = new FormData(form);
      const phone = String(data.get('phone') || '').trim().slice(0, 40);
      const normalizedPhone = normalizePeruPhone(phone);
      const phoneInput = form.elements?.namedItem('phone');
      phoneInput?.setCustomValidity(normalizedPhone ? '' : 'Ingresa un celular peruano válido de 9 dígitos empezando en 9.');
      if (!normalizedPhone || !String(data.get('city') || '').trim() || !String(data.get('interest') || '').trim()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        phoneInput?.reportValidity();
        return;
      }
      const payload = {
        ...getAttribution(),
        name: String(data.get('name') || '').trim().slice(0, 120),
        phone: normalizedPhone,
        interest: (String(data.get('interest') || '').trim().slice(0, 100) + ' | Destino: ' + String(data.get('city') || '').trim().slice(0, 80)),
        budget: String(data.get('budget') || 'Por definir').trim().slice(0, 100),
        source: 'contact_form',
        path: window.location.pathname,
        page_url: window.location.href.slice(0, 500),
        referrer: document.referrer.slice(0, 500)
      };

      if (!payload.name || !payload.phone) return;

      let status = form.querySelector('[data-lead-status]');
      if (!status) {
        status = document.createElement('p');
        status.dataset.leadStatus = 'true';
        status.setAttribute('role', 'status');
        form.appendChild(status);
      }
      form.querySelector('[data-lead-capture="continuation"]')?.remove();
      delete form.dataset.leadSaved;
      const button = form.querySelector('button[type="submit"],button:not([type])');
      pending.add(form);
      if (button) button.disabled = true;
      status.textContent = 'Guardando solicitud…';
      try {
        const result = await submitLeadOnce(payload);
        if (!result.saved) {
          status.textContent = 'No pudimos confirmar el guardado. Tus datos siguen aquí. No repetiremos este envío para evitar duplicados; el guardado queda pendiente.';
          return;
        }
        setGoogleUserData(phone);
        if (!result.duplicate) {
          window.dispatchEvent(new CustomEvent('tnm-lead-saved', { detail: { event_label: 'contact_form_saved', lead_id: result.lead_id } }));
        }
        const message = 'Hola Tiendanovamovil.\nNombre: ' + payload.name + '\nTeléfono: ' + payload.phone + '\nCiudad / provincia: ' + data.get('city') + '\nProducto: ' + data.get('interest') + '\nPresupuesto: ' + payload.budget;
        const url = 'https://wa.me/51953587927?text=' + encodeURIComponent(message);
        const link = document.createElement('a');
        link.dataset.leadCapture = 'continuation';
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Abrir WhatsApp y enviar mi mensaje';
        form.dataset.leadSaved = 'true';
        form.appendChild(link);
        status.textContent = 'Solicitud guardada. En WhatsApp, toca Enviar. Si no se abrió, usa el enlace.';
        window.dispatchEvent(new CustomEvent('tnm-whatsapp-ready', { detail: {} }));
        try { window.open(url, '_blank', 'noopener,noreferrer'); } catch {}
      } catch {
        status.textContent = 'No pudimos confirmar el guardado. Conservamos tus datos; no abrimos WhatsApp ni repetimos el envío.';
      } finally {
        pending.delete(form);
        if (button) button.disabled = false;
      }
    };

    const onInput = event => { if (event.target.name === 'phone') event.target.setCustomValidity(''); };
    document.addEventListener('input', onInput);
    document.addEventListener('submit', onSubmit, true);
    return () => { document.removeEventListener('submit', onSubmit, true); document.removeEventListener('input', onInput); };
  }, []);

  return null;
}

