import { NextResponse } from 'next/server';

const webhook = process.env.GOOGLE_SHEETS_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbyZVUmxALFciDz3HQIeKFRXVeO-FRMt1oGgYscmWghmMhkHhpfI3S-B3uLaw8JxwXv54A/exec';
export async function POST(request) {
  const reply = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  try {
    if (request.headers.get('origin') && new URL(request.headers.get('origin')).host !== new URL(request.url).host) return reply({ error: 'Origen no permitido.' }, 403);
    const raw = await request.text();
    if (raw.length > 20000) return reply({ error: 'El formulario supera el tamaño permitido.' }, 413);
    const body = JSON.parse(raw);
    const data = {};
    const limits = { name: 120, document: 30, address: 300, phone: 40, email: 160, representative: 200, product: 500, amount: 30, order: 100, detail: 4000, request: 2000, type: 20, kind: 20 };
    for (const [key, limit] of Object.entries(limits)) {
      if (typeof body[key] !== 'string' || body[key].length > limit) return reply({ error: 'Revisa los campos del formulario.' }, 400);
      data[key] = body[key].trim();
    }
    if (!['Reclamo', 'Queja'].includes(data.type) || !['Producto', 'Servicio'].includes(data.kind) ||
      !data.name || !data.document || !data.address || !data.product || !data.detail || !data.request ||
      !/^[+\d\s()-]{6,40}$/.test(data.phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
      (data.amount && !/^\d{1,8}(\.\d{1,2})?$/.test(data.amount)) ||
      (body.minor === true && !data.representative) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id || '')) {
      return reply({ error: 'Completa correctamente los campos obligatorios.' }, 400);
    }
    const id = `REC-${body.id}`;
    const submittedAt = new Date().toISOString();
    const record = { codigo: id, tienda: 'Tiendanovamovil', fecha: submittedAt, ...data, minor: body.minor === true };
    const response = await fetch(webhook, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: id, name: data.name, phone: data.phone,
        interest: JSON.stringify({ ...record, fecha: undefined }),
        budget: data.amount ? `S/ ${data.amount}` : 'No indicado', source: 'reclamaciones', submitted_at: submittedAt }),
      signal: AbortSignal.timeout(20000), cache: 'no-store', redirect: 'follow'
    });
    const result = response.ok ? await response.json() : null;
    if (result?.ok !== true || result?.saved === false) return reply({ error: 'No pudimos confirmar el registro. Conserva tus datos y comunícate con la tienda indicando tu código: ' + id }, 503);
    return reply({ saved: true, record });
  } catch {
    return reply({ error: 'No pudimos confirmar el registro. Conserva tus datos y contacta con la tienda. No vuelvas a enviar automáticamente.' }, 503);
  }
}
