import { NextResponse } from 'next/server';

const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyZVUmxALFciDz3HQIeKFRXVeO-FRMt1oGgYscmWghmMhkHhpfI3S-B3uLaw8JxwXv54A/exec';
const WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

function clean(value, max = 250) {
  return String(value || '').trim().slice(0, max);
}

async function sendToSheets(lead) {
  // Apps Script appends rows without idempotency. Never replay an ambiguous POST.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead), redirect: 'follow', cache: 'no-store', signal: controller.signal
    });
    if (!response.ok) return { saved: false, warning: `sheets_http_${response.status}` };
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); }
    catch { return { saved: false, warning: 'sheets_invalid_response' }; }
    // The deployed Apps Script contract returns {ok:true} only after appendRow.
    if (result?.ok !== true || result?.saved === false) {
      return { saved: false, warning: result?.error || 'sheets_unconfirmed_save' };
    }
    return { saved: true };
  } catch (error) {
    return { saved: false, warning: error?.name === 'AbortError' ? 'sheets_timeout' : 'sheets_network_error' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const lead = {
      lead_id: /^[a-zA-Z0-9_-]{1,80}$/.test(String(body.lead_id || '')) ? String(body.lead_id) : '',
      name: clean(body.name, 120),
      phone: clean(body.phone, 40),
      interest: clean(body.interest, 45000),
      budget: clean(body.budget, 100),
      source: clean(body.source || body.utm_source || 'web', 120),
      campaign: clean(body.utm_campaign, 180),
      utm_source: clean(body.utm_source, 120),
      utm_medium: clean(body.utm_medium, 120),
      utm_campaign: clean(body.utm_campaign, 180),
      utm_content: clean(body.utm_content, 180),
      utm_term: clean(body.utm_term, 180),
      gclid: clean(body.gclid, 250),
      gbraid: clean(body.gbraid, 250),
      wbraid: clean(body.wbraid, 250),
      fbclid: clean(body.fbclid, 250),
      landing_page: clean(body.landing_page || body.page_url, 500),
      referrer: clean(body.first_referrer || body.referrer, 500),
      page_url: clean(body.page_url, 500),
      submitted_at: body.submitted_at || new Date().toISOString()
    };

    if (!lead.name || !lead.phone) {
      return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 });
    }

    const result = await sendToSheets(lead);

    // No bloqueamos el contacto por WhatsApp si Google Sheets tiene una falla temporal.
    // saved:false is unconfirmed: do not automatically retry a possibly committed write.
    return NextResponse.json({ ok: true, saved: result.saved, warning: result.warning || null, lead_id: lead.lead_id });
  } catch {
    return NextResponse.json({ ok: true, saved: false, warning: 'lead_capture_failed' });
  }
}


