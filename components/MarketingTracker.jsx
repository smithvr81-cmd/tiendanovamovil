'use client';

import { useEffect } from 'react';

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || '';
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18345503163';
const ADS_WHATSAPP_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL || '';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'fbclid'];

function getAttribution() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('tnm_attribution') || '{}');
  } catch {
    return {};
  }
}

function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  const current = getAttribution();
  let changed = false;

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      current[key] = value.slice(0, 250);
      changed = true;
    }
  }

  if (changed || !current.landing_page) {
    current.landing_page = current.landing_page || window.location.href.slice(0, 500);
    current.first_referrer = current.first_referrer || document.referrer.slice(0, 500);
    current.captured_at = current.captured_at || new Date().toISOString();
    localStorage.setItem('tnm_attribution', JSON.stringify(current));
  }

  return current;
}

function loadScript(id, src) {
  if (!id || document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function enableMarketingScripts() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };

  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted'
  });

  if (GA4_ID) {
    loadScript('tnm-ga4', `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`);
    window.gtag('config', GA4_ID, { anonymize_ip: true });
  }

  if (GTM_ID && !document.getElementById('tnm-gtm')) {
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    loadScript('tnm-gtm', `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`);
  }

  if (META_PIXEL_ID && !window.fbq) {
    const fbq = function(){ fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    window.fbq = fbq;
    loadScript('tnm-meta-pixel', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }
}

function denyMarketingScripts() {
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }
}

export default function MarketingTracker() {
  useEffect(() => {
    const attribution = captureAttribution();
    window.dataLayer = window.dataLayer || [];

    const consent = localStorage.getItem('tnm_analytics_consent');
    if (consent === 'accepted') enableMarketingScripts();
    if (consent === 'rejected') denyMarketingScripts();

    window.dataLayer.push({ event: 'campaign_attribution', ...attribution });

    const originalGtag = typeof window.gtag === 'function' ? window.gtag : null;
    const originalOpen = window.open.bind(window);
    let lastWhatsappAt = 0;

    const fireWhatsappConversion = (details = {}) => {
      const now = Date.now();
      lastWhatsappAt = now;
      const attrs = getAttribution();
      const payload = {
        event_category: 'conversion',
        event_label: details.event_label || details.label || details.source || 'whatsapp',
        link_url: details.link_url || '',
        page_location: window.location.href,
        ...attrs
      };

      window.dataLayer.push({ event: 'whatsapp_click', ...payload });

      if (originalGtag) {
        originalGtag('event', 'whatsapp_click', payload);
        if (ADS_ID && ADS_WHATSAPP_LABEL) {
          originalGtag('event', 'conversion', {
            send_to: `${ADS_ID}/${ADS_WHATSAPP_LABEL}`,
            value: Number(details.value || 1),
            currency: details.currency || 'PEN'
          });
        }
      }

      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Contact', {
          content_name: payload.event_label,
          currency: details.currency || 'PEN',
          value: Number(details.value || 0)
        });
      }
    };

    if (originalGtag) {
      window.gtag = function wrappedGtag(...args) {
        if (args[0] === 'event' && args[1] === 'whatsapp_click') {
          const details = args[2] || {};
          lastWhatsappAt = Date.now();
          window.dataLayer.push({ event: 'whatsapp_click', ...details, ...getAttribution() });
          if (ADS_ID && ADS_WHATSAPP_LABEL) {
            originalGtag('event', 'conversion', {
              send_to: `${ADS_ID}/${ADS_WHATSAPP_LABEL}`,
              value: Number(details.value || 1),
              currency: details.currency || 'PEN'
            });
          }
          if (typeof window.fbq === 'function') window.fbq('track', 'Contact');
        }
        return originalGtag(...args);
      };
    }

    const onClick = (event) => {
      const link = event.target.closest?.('a[href*="wa.me"],a[href*="whatsapp.com"]');
      if (!link) return;
      fireWhatsappConversion({ source: link.getAttribute('aria-label') || link.textContent?.trim() || 'whatsapp_link', link_url: link.href });
    };

    document.addEventListener('click', onClick, true);

    window.open = function patchedOpen(url, ...args) {
      const href = typeof url === 'string' ? url : String(url || '');
      if ((href.includes('wa.me/') || href.includes('whatsapp.com/')) && Date.now() - lastWhatsappAt > 800) {
        fireWhatsappConversion({ source: 'whatsapp_programmatic', link_url: href });
      }
      return originalOpen(url, ...args);
    };

    const onConsent = (event) => {
      if (event.detail === 'accepted') enableMarketingScripts();
      if (event.detail === 'rejected') denyMarketingScripts();
    };
    window.addEventListener('tnm-consent-changed', onConsent);

    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('tnm-consent-changed', onConsent);
      window.open = originalOpen;
      if (originalGtag) window.gtag = originalGtag;
    };
  }, []);

  return null;
}
