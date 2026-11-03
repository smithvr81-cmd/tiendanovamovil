export const complaintLabels = {
  numero: 'Número de atención', codigo: 'Código de seguimiento', tienda: 'Tienda',
  fecha: 'Fecha y hora de recepción (Perú)', name: 'Nombres y apellidos',
  document: 'DNI / CE / pasaporte', address: 'Domicilio', phone: 'Teléfono',
  email: 'Correo de respuesta', minor: 'Menor de edad', representative: 'Padre, madre o representante',
  type: 'Tipo de solicitud', kind: 'Bien contratado', product: 'Descripción',
  amount: 'Monto reclamado (S/)', order: 'Pedido o comprobante', detail: 'Detalle', request: 'Pedido del consumidor'
};

export function complaintValue(record, key) {
  const value = record[key];
  if (key === 'fecha' && value && Number.isFinite(Date.parse(value))) {
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(value)) + ' (UTC−05:00)';
  }
  return typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value || 'No indicado';
}

export function complaintCopy(record, confirmed = true) {
  const heading = confirmed ? 'CONSTANCIA DE ATENCIÓN — TIENDANOVAMOVIL' : 'ENVÍO PENDIENTE DE CONFIRMACIÓN — TIENDANOVAMOVIL';
  const fields = Object.entries(complaintLabels).filter(([key]) => confirmed || key !== 'numero')
    .map(([key, label]) => `${!confirmed && key === 'fecha' ? 'Fecha y hora del intento (Perú)' : label}: ${complaintValue(record, key)}`).join('\n\n');
  return `${heading}\n\n${fields}\n\n${confirmed
    ? 'Estado: Pendiente de respuesta del proveedor.\nRespuesta y acciones adoptadas: Por registrar.\nFecha de respuesta: Pendiente.\nLa respuesta se enviará por correo en un máximo de 15 días hábiles improrrogables.'
    : 'Esta copia NO acredita que la solicitud haya sido registrada. Conserva el código y consulta con la tienda antes de volver a enviar los datos.'}\n\nEsta copia corresponde al canal de atención de reclamaciones y quejas. La habilitación del Libro de Reclamaciones formal está pendiente.\nLa copia no se envía automáticamente por correo.\nContacto: +51 935 748 390\n`;
}

const referenceKey = 'nova-complaint-reference-v1';
export function saveComplaintReference(storage, reference) {
  try { storage?.setItem(referenceKey, JSON.stringify({ codigo: reference.codigo, fecha: reference.fecha, confirmed: reference.confirmed === true })); } catch { /* Storage may be blocked; the on-screen copy remains available. */ }
}
export function readComplaintReference(storage) {
  try {
    const value = JSON.parse(storage?.getItem(referenceKey) || 'null');
    return value && /^REC-[0-9a-f-]{36}$/i.test(value.codigo) && Number.isFinite(Date.parse(value.fecha))
      ? { codigo: value.codigo, fecha: value.fecha, confirmed: value.confirmed === true } : null;
  } catch { return null; }
}
export function clearComplaintReference(storage) {
  try { storage?.removeItem(referenceKey); } catch { /* Optional storage. */ }
}
