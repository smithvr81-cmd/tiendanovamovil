import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };
}

function configured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export async function GET() {
  if (!configured()) {
    return NextResponse.json({ reviews: [], configured: false }, { status: 200 });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/reviews?approved=eq.true&select=id,name,social_network,social_handle,rating,comment,created_at&order=created_at.desc&limit=50`,
      { headers: headers(), cache: 'no-store' }
    );

    if (!response.ok) throw new Error('No se pudieron obtener las reseñas');
    const reviews = await response.json();
    return NextResponse.json({ reviews, configured: true });
  } catch {
    return NextResponse.json({ reviews: [], configured: true }, { status: 500 });
  }
}

export async function POST(request) {
  if (!configured()) {
    return NextResponse.json(
      { error: 'El sistema de reseñas todavía no está conectado a la base de datos.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const name = String(body.name || '').trim().slice(0, 80);
    const email = String(body.email || '').trim().slice(0, 160);
    const socialNetwork = String(body.socialNetwork || '').trim().slice(0, 40);
    const socialHandle = String(body.socialHandle || '').trim().slice(0, 120);
    const comment = String(body.comment || '').trim().slice(0, 800);
    const rating = Number(body.rating);
    const consent = Boolean(body.consent);

    if (!name || !email || !comment || !consent || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Completa todos los campos obligatorios.' }, { status: 400 });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'return=minimal' },
      body: JSON.stringify({
        name,
        email,
        social_network: socialNetwork || null,
        social_handle: socialHandle || null,
        rating,
        comment,
        consent,
        approved: false
      })
    });

    if (!response.ok) throw new Error('No se pudo registrar la reseña');
    return NextResponse.json({ ok: true, message: 'Reseña recibida. Se publicará después de ser revisada.' });
  } catch {
    return NextResponse.json({ error: 'No pudimos guardar tu reseña. Intenta nuevamente.' }, { status: 500 });
  }
}
