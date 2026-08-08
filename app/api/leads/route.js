import { NextResponse } from 'next/server';

const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycby8ux-ew9-c_HAmRhCr9HL4LpMdbg3qO7HOW15EJY6zsZ4tgyaHuDSSyW6B3N-_jYgDhg/exec';
const WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

function clean(value, max = 250) {
  return String(value || '').trim().slice(0, max);
}

async function sendToSheets(lead) {
  let lastError = 'sheets_webhook_failed';

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        lastError = `sheets_http_${response.status}`;
        continue;
      }

      const text = await response.text();
      let result = { ok: true };
      try {
        result = JSON.parse(text || '{}');
      } catch {
        result = { ok: true };
      }

      if (result?.ok === false) {
        lastError = result.error || 'sheets_webhook_failed';
        continue;
      }

      return { saved: true };
    } catch (error) {
      lastError = error?.name === 'AbortError' ? 'sheets_timeout' : 'sheets_network_error';
    }
  }

  return { saved: false, warning: lastError };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const lead = {
      name: clean(body.name, 120),
      phone: clean(body.phone, 40),
      interest: clean(body.interest, 180),
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
    // El cliente recibe saved:false para poder conservar el lead localmente y reintentarlo luego.
    return NextResponse.json({ ok: true, saved: result.saved, warning: result.warning || null });
  } catch {
    return NextResponse.json({ ok: true, saved: false, warning: 'lead_capture_failed' });
  }
}
