// Session-scoped duplicate suppression, not a replacement for durable webhook idempotency.
// Store only a digest and result metadata, never customer contact details.
const KEY = 'tnm_lead_attempts_v1';
const TTL = 30 * 60 * 1000;
const attempts = new Map();
const normalize = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
export function inquiryKey(payload) {
  let phone = String(payload.phone || '').replace(/\D/g, '');
  if (phone.length === 9) phone = '51' + phone;
  return JSON.stringify([normalize(payload.name), phone, normalize(payload.interest), normalize(payload.budget)]);
}
export async function submitLeadOnce(payload) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(inquiryKey(payload)));
  const key = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
  const now = Date.now();
  const previous = attempts.get(key);
  if (previous && now - previous.at < TTL) return { ...(await previous.promise), duplicate: true };
  let ledger = {};
  try { ledger = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch {}
  if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) ledger = {};
  for (const k of Object.keys(ledger)) if (!ledger[k]?.at || now - ledger[k].at >= TTL) delete ledger[k];
  if (ledger[key]) return { ...ledger[key].result, duplicate: true };
  const lead_id = crypto.randomUUID();
  const unconfirmed = { ok: true, saved: false, lead_id, warning: 'save_unconfirmed_no_retry' };
  const persist = result => {
    // Merge other in-flight inquiries instead of overwriting their entries.
    try { Object.assign(ledger, JSON.parse(sessionStorage.getItem(KEY) || '{}')); } catch {}
    for (const k of Object.keys(ledger)) if (!ledger[k]?.at || now - ledger[k].at >= TTL) delete ledger[k];
    ledger[key] = { at: now, result };
    try { sessionStorage.setItem(KEY, JSON.stringify(ledger)); } catch {}
  };
  // Record before the request: reloading after an ambiguous write must not replay it.
  persist(unconfirmed);
  const promise = (async () => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, lead_id }), keepalive: true
      });
      const result = await response.json();
      const confirmed = { ...unconfirmed, saved: response.ok && result.ok === true && result.saved === true, duplicate: result.duplicate === true, error: response.status === 400 ? result.error : undefined };
      persist(confirmed);
      return confirmed;
    } catch { return unconfirmed; }
  })();
  attempts.set(key, { at: now, promise });
  return promise;
}

export function suggestedInterest(message) {
  const match = String(message || '').match(/me interesa\s+(.+?)(?:\. Estoy|\n|$)/i);
  if (match) return match[1].trim().slice(0, 100);
  if (/deseo cotizar este pedido/i.test(message)) return 'Cotizar los productos de mi carrito';
  return '';
}

export function cartInquiryContext(message) {
  if (!/deseo cotizar este pedido/i.test(message)) return '';
  return String(message).split('\n').filter(line => /^\s*•/.test(line)).map(line => line.trim()).join('; ');
}
