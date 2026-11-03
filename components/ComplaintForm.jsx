'use client';
import { useEffect, useRef, useState } from 'react';
import { complaintLabels as labels, complaintValue, complaintCopy, saveComplaintReference, readComplaintReference, clearComplaintReference } from '../lib/complaintReceipt.mjs';

function browserStorage() { try { return window.sessionStorage; } catch { return null; } }
function download(record, confirmed) {
  const url = URL.createObjectURL(new Blob([complaintCopy(record, confirmed)], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url;
  link.download = `${record.numero || record.codigo}${confirmed ? '' : '-pendiente'}.txt`;
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ComplaintForm() {
  const inFlight = useRef(false);
  const [minor, setMinor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [restored, setRestored] = useState(null);
  const [ready, setReady] = useState(false);
  const [attempted, setAttempted] = useState(false);
  useEffect(() => { setRestored(readComplaintReference(browserStorage())); setReady(true); }, []);

  async function sendSnapshot(attempt) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setAttempted(true); setError('');
    saveComplaintReference(browserStorage(), { codigo: attempt.codigo, fecha: attempt.fecha, confirmed: false });
    try {
      const response = await fetch('/api/reclamaciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(attempt), signal: AbortSignal.timeout(25000) });
      const result = await response.json();
      if (!response.ok || result.saved !== true || result.record?.codigo !== attempt.codigo) {
        if (response.status === 400 || response.status === 403 || response.status === 413) {
          setAttempted(false); setSnapshot(null); clearComplaintReference(browserStorage());
        }
        throw new Error(result.error || 'No se pudo confirmar el registro.');
      }
      setReceipt(result.record);
      saveComplaintReference(browserStorage(), { codigo: result.record.codigo, fecha: result.record.fecha, confirmed: true });
    } catch (failure) {
      setError(failure.name === 'TimeoutError' || failure.name === 'AbortError'
        ? 'La respuesta tardó más de lo esperado. El registro puede haberse guardado; conserva el código y verifica el mismo registro.'
        : failure.message || 'No pudimos confirmar el registro. Conserva tu código y consulta con la tienda.');
    } finally { inFlight.current = false; setBusy(false); }
  }
  function submit(event) {
    event.preventDefault();
    if (inFlight.current || attempted || !ready || restored) return;
    const id = crypto.randomUUID();
    const attempt = { ...Object.fromEntries(new FormData(event.currentTarget)), minor, id,
      codigo: 'REC-' + id, tienda: 'Tiendanovamovil', fecha: new Date().toISOString() };
    setSnapshot(attempt); sendSnapshot(attempt);
  }
  function startAnother() {
    clearComplaintReference(browserStorage()); setRestored(null); setReceipt(null);
    setSnapshot(null); setAttempted(false); setMinor(false); setError('');
  }
  if (!ready) return <article className="legalCard" role="status">Preparando formulario…</article>;
  if (restored) return <article className="legalCard complaintPending" role="status"><h2>{restored.confirmed ? 'Ya registraste una solicitud en esta pestaña' : 'Hay un envío pendiente de confirmación'}</h2><p><strong>Código de seguimiento: {restored.codigo}</strong></p><p>{restored.confirmed ? 'Fecha del registro: ' : 'Fecha del intento: '}{complaintValue(restored, 'fecha')}</p><p>Por privacidad, los datos del formulario no se guardan en el navegador. Para consultar este caso, comunícate al <a href="tel:+51935748390">+51 935 748 390</a> e indica tu código. No vuelvas a enviar la misma solicitud desde otro formulario.</p>{restored.confirmed && <button type="button" onClick={startAnother}>Registrar otra solicitud distinta</button>}</article>;
  if (receipt) return <article className="legalCard complaintReceipt" role="status"><h2>Tu solicitud ha sido registrada</h2><p>Conserva tu número y descarga una copia. La respuesta se enviará a <strong>{receipt.email}</strong>.</p><dl>{Object.entries(labels).map(([key,label]) => <div key={key}><dt>{label}</dt><dd>{complaintValue(receipt, key)}</dd></div>)}</dl><h3>4. Atención del proveedor</h3><p><strong>Estado:</strong> Pendiente de respuesta.</p><p><strong>Respuesta y acciones adoptadas:</strong> Por registrar.</p><p><strong>Fecha de respuesta:</strong> Pendiente.</p><div className="complaintActions"><button type="button" onClick={() => download(receipt, true)}>Descargar constancia</button><button type="button" onClick={() => window.print()}>Imprimir / guardar PDF</button></div><p>Respuesta en un máximo de 15 días hábiles improrrogables. La copia no se envía automáticamente por correo.</p><p>Constancia del canal de atención. La habilitación del Libro de Reclamaciones formal está pendiente.</p><button className="complaintNew" type="button" onClick={startAnother}>Registrar otra solicitud distinta</button></article>;
  const input = (name, label, maxLength, extra = {}) => <label>{label}<input name={name} maxLength={maxLength} required {...extra}/></label>;
  return <form className="legalCard complaintForm" onSubmit={submit} data-lead-capture="managed">
    <p>Los campos marcados con * son obligatorios. No adjuntes contraseñas, datos de tarjeta ni información bancaria.</p>
    <fieldset disabled={busy || attempted}><legend>1. Tus datos</legend><div className="complaintGrid">
      {input('name', 'Nombres y apellidos *', 120, { autoComplete: 'name' })}
      {input('document', 'DNI / CE / pasaporte *', 30)}
      {input('address', 'Domicilio completo *', 300, { autoComplete: 'street-address' })}
      {input('phone', 'Teléfono de contacto *', 40, { type: 'tel', autoComplete: 'tel', pattern: '[+0-9 ()-]{6,40}' })}
      {input('email', 'Correo para recibir la respuesta *', 160, { type: 'email', autoComplete: 'email' })}
    </div><label className="complaintCheck"><input type="checkbox" checked={minor} onChange={e=>setMinor(e.target.checked)}/> Soy menor de edad</label>
    {input('representative', minor ? 'Nombre y contacto del padre, madre o representante *' : 'Representante (opcional)', 200, { required: minor })}</fieldset>
    <fieldset disabled={busy || attempted}><legend>2. Producto o servicio</legend><div className="complaintGrid"><label>Bien contratado *<select name="kind" defaultValue="Producto"><option>Producto</option><option>Servicio</option></select></label>
      {input('order', 'Número de pedido / comprobante (opcional)', 100, { required: false })}
      {input('product', 'Descripción del producto o servicio *', 500)}
      {input('amount', 'Monto reclamado en soles (opcional)', 30, { required: false, type: 'number', min: '0', max: '99999999.99', step: '0.01' })}
    </div></fieldset>
    <fieldset disabled={busy || attempted}><legend>3. Tu solicitud</legend><label>Tipo *<select name="type" defaultValue="Reclamo"><option>Reclamo</option><option>Queja</option></select></label><label>Describe lo ocurrido *<textarea name="detail" required maxLength={4000} rows={6}/></label><label>¿Qué solución solicitas? *<textarea name="request" required maxLength={2000} rows={4}/></label></fieldset>
    <p>Usaremos tus datos para registrar, evaluar y responder esta solicitud. No se publicarán ni se utilizarán para publicidad. Consulta nuestra <a href="/privacidad">política de privacidad</a>.</p>
    <button type="submit" disabled={busy || attempted}>{busy ? 'Registrando…' : attempted ? 'Registro pendiente de confirmación' : 'Enviar reclamación o queja'}</button>
    {error && <div className="complaintPending" role="alert"><p>{error}</p>{snapshot && <><p><strong>Código de seguimiento: {snapshot.codigo}</strong></p><p>Conserva una copia de los datos enviados. Si verificas de nuevo, usaremos el mismo código y los mismos datos para evitar duplicados.</p><div className="complaintActions"><button type="button" disabled={busy} onClick={() => download(snapshot, false)}>Descargar copia pendiente</button><button type="button" disabled={busy} onClick={() => sendSnapshot(snapshot)}>Verificar el mismo registro</button></div></>}</div>}
    <p>Al confirmar el registro, podrás descargar o imprimir tu constancia. La copia no se envía automáticamente por correo.</p>
  </form>;
}
