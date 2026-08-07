import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return NextResponse.json({ ok: true, configured: false });

  try {
    const body = await request.json();
    const event = {
      path: String(body.path || '/').slice(0, 300),
      referrer: String(body.referrer || '').slice(0, 500),
      language: String(body.language || '').slice(0, 30),
      timezone: String(body.timezone || '').slice(0, 80),
      screen: String(body.screen || '').slice(0, 30),
      device: String(body.device || '').slice(0, 30)
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) throw new Error('analytics insert failed');
    return NextResponse.json({ ok: true, configured: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
