import { NextResponse } from 'next/server';

const WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || '';

function clean(value, max = 250) {
  return String(value || '').trim().slice(0, max);
}

export async function POST(request) {
  if (!WEBHOOK_URL) {
    return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  }

  try {
    const body = await request.json();
    const lead = {
      name: clean(body.name, 120),
      phone: clean(body.phone, 40),
      interest: clean(body.interest, 180),
      budget: clean(body.budget, 100),
      source: clean(body.utm_source || 'web', 120),
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
      submitted_at: new Date().toISOString()
    };

    if (!lead.name || !lead.phone) {
      return NextResponse.json({ ok: false, error: 'missing_required_fields' }, { status: 400 });
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: 'sheets_webhook_failed' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'lead_capture_failed' }, { status: 500 });
  }
}
