'use client';
import { useRef, useState } from 'react';
const labels = { codigo: 'Código de atención', tienda: 'Tienda', fecha: 'Fecha y hora de recepción (UTC)', name: 'Nombre', document: 'DNI / CE / pasaporte', address: 'Domicilio', phone: 'Teléfono', email: 'Correo de respuesta', minor: 'Menor de edad', representative: 'Padre, madre o representante', type: 'Tipo de solicitud', kind: 'Bien contratado', product: 'Descripción', amount: 'Monto reclamado (S/)', order: 'Pedido o comprobante', detail: 'Detalle', request: 'Pedido del consumidor' };
export default function ComplaintForm() {
  const id = useRef(null);
  const [minor, setMinor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [attempted, setAttempted] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy || attempted) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    id.current ||= crypto.randomUUID();
    setBusy(true); setAttempted(true); setError('');
    try {
      const response = await fetch('/api/reclamaciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, minor, id: id.current }) });
      const result = await response.json();
      if (!response.ok || result.saved !== true) {
        if (response.status === 400) setAttempted(false);
        throw new Error(result.error || 'No se pudo confirmar el registro.');
      }
      setReceipt(result.record);
    } catch (error) {
      setError(error.message + ' Tu código de atención es REC-' + id.current + '. Tus datos permanecen en el formulario.');
    } finally { setBusy(false); }
  }
  function download() {
    const text = 'CONSTANCIA DE ATENCIÓN — TIENDANOVAMOVIL\n\n' + Object.entries(labels).map(([key, label]) => `${label}: ${typeof receipt[key] === 'boolean' ? (receipt[key] ? 'Sí' : 'No') : receipt[key] || 'No indicado'}`).join('\n\n') + '\n\nRespuesta por correo en un máximo de 15 días hábiles improrrogables.\nEsta constancia corresponde al canal de atención de reclamaciones y quejas.\n';
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${receipt.codigo}.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (receipt) return <article className="legalCard complaintReceipt" role="status"><h2>Tu solicitud ha sido registrada</h2><p>Conserva tu código y descarga una copia. La respuesta se enviará a <strong>{receipt.email}</strong>.</p><dl>{Object.entries(labels).map(([key,label]) => <div key={key}><dt>{label}</dt><dd>{typeof receipt[key] === 'boolean' ? (receipt[key] ? 'Sí' : 'No') : receipt[key] || 'No indicado'}</dd></div>)}</dl><div className="complaintActions"><button onClick={download}>Descargar constancia</button><button onClick={() => window.print()}>Imprimir / guardar PDF</button></div><p>Respuesta en un máximo de 15 días hábiles improrrogables.</p></article>;
  const input = (name, label, maxLength, extra = {}) => <label>{label}<input name={name} maxLength={maxLength} required {...extra}/></label>;
  return <form className="legalCard complaintForm" onSubmit={submit} data-lead-capture="managed">
    <p>Los campos marcados con * son obligatorios. No adjuntes contraseñas, datos de tarjeta ni información bancaria.</p>
    <fieldset disabled={busy}><legend>1. Tus datos</legend><div className="complaintGrid">
      {input('name', 'Nombres y apellidos *', 120, { autoComplete: 'name' })}
      {input('document', 'DNI / CE / pasaporte *', 30)}
      {input('address', 'Domicilio completo *', 300, { autoComplete: 'street-address' })}
      {input('phone', 'Teléfono de contacto *', 40, { type: 'tel', autoComplete: 'tel', pattern: '[+0-9 ()-]{6,40}' })}
      {input('email', 'Correo para recibir la respuesta *', 160, { type: 'email', autoComplete: 'email' })}
    </div><label className="complaintCheck"><input type="checkbox" checked={minor} onChange={e=>setMinor(e.target.checked)}/> Soy menor de edad</label>
    {input('representative', minor ? 'Nombre y contacto del padre, madre o representante *' : 'Representante (opcional)', 200, { required: minor })}</fieldset>
    <fieldset disabled={busy}><legend>2. Producto o servicio</legend><div className="complaintGrid"><label>Bien contratado *<select name="kind" defaultValue="Producto"><option>Producto</option><option>Servicio</option></select></label>
      {input('order', 'Número de pedido / comprobante (opcional)', 100, { required: false })}
      {input('product', 'Descripción del producto o servicio *', 500)}
      {input('amount', 'Monto reclamado en soles (opcional)', 30, { required: false, type: 'number', min: '0', max: '99999999.99', step: '0.01' })}
    </div></fieldset>
    <fieldset disabled={busy}><legend>3. Tu solicitud</legend><label>Tipo *<select name="type" defaultValue="Reclamo"><option>Reclamo</option><option>Queja</option></select></label><label>Describe lo ocurrido *<textarea name="detail" required maxLength={4000} rows={6}/></label><label>¿Qué solución solicitas? *<textarea name="request" required maxLength={2000} rows={4}/></label></fieldset>
    <p>Usaremos tus datos para registrar, evaluar y responder esta solicitud. No se publicarán ni se utilizarán para publicidad. Consulta nuestra <a href="/privacidad">política de privacidad</a>.</p>
    <button type="submit" disabled={busy || attempted}>{busy ? 'Registrando…' : attempted ? 'Registro pendiente de confirmación' : 'Enviar reclamación o queja'}</button>
    <p role="alert">{error}</p>
  </form>;
}
