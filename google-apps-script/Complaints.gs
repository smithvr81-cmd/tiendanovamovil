// Separate attention register. This number is not a formal Libro sheet number.
const NOVA_COMPLAINT_HEADERS = ['Numero', 'Codigo', 'Fecha', 'Datos', 'Estado', 'Respuesta', 'Fecha_respuesta'];
function novaComplaintSheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('RegistroReclamaciones');
}
function novaComplaintHeadersMatch(sheet) {
  return !!sheet && sheet.getLastRow() >= 1 && JSON.stringify(sheet.getRange(1, 1, 1, 7).getValues()[0]) === JSON.stringify(NOVA_COMPLAINT_HEADERS);
}
function complaintStoreHealth() {
  try { return { version: 1, ready: novaComplaintHeadersMatch(novaComplaintSheet()) }; }
  catch (_) { return { version: 1, ready: false }; }
}
function prepareComplaintStore() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('complaint_store_busy');
  try {
    const book = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = book.getSheetByName('RegistroReclamaciones');
    if (!sheet) {
      sheet = book.insertSheet('RegistroReclamaciones');
      sheet.getRange(1, 1, 1, 7).setValues([NOVA_COMPLAINT_HEADERS]);
      SpreadsheetApp.flush();
    }
    if (!novaComplaintHeadersMatch(sheet)) throw new Error('complaint_store_headers');
    return { version: 1, ready: true };
  } finally { lock.releaseLock(); }
}
function novaComplaintCanonical(data) {
  if (!data || data.source !== 'reclamaciones' || !/^REC-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.lead_id || '')) throw new Error('invalid_complaint');
  const input = JSON.parse(data.interest);
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_complaint');
  const limits = { name: 120, document: 30, address: 300, phone: 40, email: 160, representative: 200, product: 500, amount: 30, order: 100, detail: 4000, request: 2000, type: 20, kind: 20 };
  const allowed = ['codigo', 'tienda', 'fecha', 'minor'].concat(Object.keys(limits));
  if (Object.keys(input).some(key => allowed.indexOf(key) === -1)) throw new Error('invalid_complaint');
  const record = { codigo: data.lead_id, tienda: 'Tiendanovamovil' };
  for (const key of Object.keys(limits)) {
    if (typeof input[key] !== 'string' || input[key].length > limits[key]) throw new Error('invalid_complaint');
    record[key] = input[key].trim();
  }
  if (input.codigo !== data.lead_id || input.tienda !== record.tienda || typeof input.minor !== 'boolean' ||
      !['Reclamo', 'Queja'].includes(record.type) || !['Producto', 'Servicio'].includes(record.kind) ||
      !record.name || !record.document || !record.address || !record.product || !record.detail || !record.request ||
      !/^[+\d\s()-]{6,40}$/.test(record.phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email) ||
      (record.amount && !/^\d{1,8}(\.\d{1,2})?$/.test(record.amount)) ||
      (input.minor && !record.representative) || data.name !== record.name || data.phone !== record.phone) throw new Error('invalid_complaint');
  record.minor = input.minor;
  return record;
}
function novaComplaintResult(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function saveComplaint(data) {
  let locked = false;
  let lock;
  try {
    const canonical = novaComplaintCanonical(data);
    const payload = JSON.stringify(canonical);
    lock = LockService.getScriptLock();
    locked = lock.tryLock(10000);
    if (!locked) return novaComplaintResult({ ok: false, saved: false, error: 'complaint_store_busy' });
    const sheet = novaComplaintSheet();
    if (!novaComplaintHeadersMatch(sheet)) return novaComplaintResult({ ok: false, saved: false, error: 'complaint_store_not_ready' });
    const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues() : [];
    const existing = rows.filter(row => row[1] === canonical.codigo);
    if (existing.length) {
      let record;
      for (const row of existing) {
        const stored = JSON.parse(row[3]);
        const comparable = { ...stored };
        delete comparable.fecha; delete comparable.numero;
        if (JSON.stringify(comparable) !== payload || stored.codigo !== row[1] || stored.numero !== row[0] || stored.fecha !== row[2]) return novaComplaintResult({ ok: false, saved: false, error: 'complaint_id_conflict' });
        if (record && JSON.stringify(record) !== JSON.stringify(stored)) return novaComplaintResult({ ok: false, saved: false, error: 'complaint_id_conflict' });
        record = stored;
      }
      return novaComplaintResult({ ok: true, saved: true, lead_id: canonical.codigo, record, duplicate: true, email_status: 'not_configured' });
    }
    const properties = PropertiesService.getScriptProperties();
    const reserved = properties.getProperty('NOVA_COMPLAINT_SEQUENCE');
    if (reserved !== null && !/^\d+$/.test(reserved)) throw new Error('invalid_sequence');
    let maximum = Number(reserved || 0);
    for (const row of rows) {
      const match = /^AT-(\d+)$/.exec(String(row[0]));
      if (!match) throw new Error('invalid_sequence_row');
      maximum = Math.max(maximum, Number(match[1]));
    }
    const next = maximum + 1;
    if (!Number.isSafeInteger(next)) throw new Error('invalid_sequence');
    // Reserve before append. Gaps after failure are intentional; never reuse a number.
    properties.setProperty('NOVA_COMPLAINT_SEQUENCE', String(next));
    const record = { ...canonical, fecha: new Date().toISOString(), numero: 'AT-' + String(next).padStart(6, '0') };
    // User text is enclosed in JSON, never directly interpreted as a cell formula.
    // Force timestamp text: Sheets may otherwise coerce it to a Date on readback.
    sheet.appendRow([record.numero, record.codigo, "'" + record.fecha, JSON.stringify(record), 'Pendiente', '', '']);
    SpreadsheetApp.flush();
    return novaComplaintResult({ ok: true, saved: true, lead_id: record.codigo, record, duplicate: false, email_status: 'not_configured' });
  } catch (_) {
    return novaComplaintResult({ ok: false, saved: false, error: 'complaint_store_failed' });
  } finally {
    if (locked) lock.releaseLock();
  }
}
