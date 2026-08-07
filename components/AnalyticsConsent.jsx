'use client';

import { useEffect, useState } from 'react';

export default function AnalyticsConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const choice = localStorage.getItem('tnm_analytics_consent');
    if (!choice) setVisible(true);
    if (choice === 'accepted') sendVisit();
  }, []);

  const sendVisit = () => {
    const payload = {
      path: window.location.pathname,
      referrer: document.referrer || '',
      language: navigator.language || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      screen: `${window.screen.width}x${window.screen.height}`,
      device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    };
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  };

  const accept = () => {
    localStorage.setItem('tnm_analytics_consent', 'accepted');
    setVisible(false);
    window.dispatchEvent(new CustomEvent('tnm-consent-changed', { detail: 'accepted' }));
    sendVisit();
  };

  const reject = () => {
    localStorage.setItem('tnm_analytics_consent', 'rejected');
    setVisible(false);
    window.dispatchEvent(new CustomEvent('tnm-consent-changed', { detail: 'rejected' }));
  };

  if (!visible) return null;

  return (
    <div className="consentBanner" role="dialog" aria-label="Preferencias de privacidad">
      <div>
        <strong>Privacidad y estadísticas</strong>
        <p>Con tu permiso recopilamos estadísticas de navegación y campañas para medir visitas, clics en WhatsApp y mejorar la publicidad. No vendemos tus datos ni registramos información sensible.</p>
      </div>
      <div className="consentActions">
        <button onClick={reject} className="consentSecondary">Solo necesarias</button>
        <button onClick={accept} className="consentPrimary">Aceptar estadísticas</button>
      </div>
    </div>
  );
}
