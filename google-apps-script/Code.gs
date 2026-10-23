const SPREADSHEET_ID = '1q6VEJY6yd5rjUHESK64aM-MpXLfUj72Ph8BGPTXw3lw';
const SHEET_NAME = 'Leads';

// The durable idempotency ledger is the existing AA column, not process memory.
// All writers of this endpoint must use the same script lock. Deploy this script
// separately from the website; deploying Next.js alone does not enable this guard.
function jsonResult(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizedText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizedPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 9 ? '51' + digits : digits;
}

function sameInquiry(row, data) {
  return normalizedPhone(row[2]) === normalizedPhone(data.phone)
    && normalizedText(row[1]) === normalizedText(data.name)
    && normalizedText(row[3]) === normalizedText(data.interest)
    && normalizedText(row[4]) === normalizedText(data.budget);
}

// appendRow interprets formula-like strings, including international +51 phones.
// Force literal cell text without changing what the customer or seller sees.
function literalCell(value) {
  const text = String(value == null ? '' : value);
  return /^\s*[=+@-]/.test(text) ? "'" + text : text;
}

function doPost(e) {
  let lock;
  let locked = false;
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'sheet_not_found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (!data.name || !data.phone) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'missing_required_fields' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const leadId = /^[a-zA-Z0-9_-]{1,80}$/.test(String(data.lead_id || '')) ? String(data.lead_id) : '';
    lock = LockService.getScriptLock();
    locked = lock.tryLock(10000);
    if (!locked) return jsonResult({ ok: false, saved: false, error: 'lead_store_busy' });

    // Check and append under one lock. Reuse of an ID with another phone or
    // inquiry is an error, never permission to overwrite or merge old rows.
    if (leadId && sheet.getLastRow() > 0) {
      const matches = sheet.getRange(1, 27, sheet.getLastRow(), 1)
        .createTextFinder(leadId).matchEntireCell(true).useRegularExpression(false).findAll();
      if (matches.length) {
        const identical = matches.every(cell => sameInquiry(sheet.getRange(cell.getRow(), 1, 1, 5).getValues()[0], data));
        return jsonResult(identical
          ? { ok: true, saved: true, duplicate: true, lead_id: leadId }
          : { ok: false, saved: false, error: 'lead_id_conflict' });
      }
    }

    sheet.appendRow([
      data.submitted_at || new Date().toISOString(),
      data.name || '',
      data.phone || '',
      data.interest || '',
      data.budget || '',
      data.source || 'web',
      data.campaign || '',
      data.utm_source || '',
      data.utm_medium || '',
      data.utm_campaign || '',
      data.utm_content || '',
      data.utm_term || '',
      data.gclid || '',
      data.gbraid || '',
      data.wbraid || '',
      data.fbclid || '',
      data.landing_page || data.page_url || '',
      data.referrer || '',
      'Nuevo',
      '',
      '', '', '', '', '', '', // Preserve commercial columns U:Z.
      leadId
    // The phone column is always text, including local numbers and leading zeros.
    ].map((value, index) => index === 2 ? "'" + String(value == null ? '' : value) : literalCell(value)));
    // Commit the append before releasing the lock for the next request.
    SpreadsheetApp.flush();

    return ContentService.createTextOutput(JSON.stringify({ ok: true, saved: true, lead_id: leadId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch {
    return jsonResult({ ok: false, saved: false, error: 'lead_store_failed' });
  } finally {
    if (locked) lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'Tiendanovamovil Leads' }))
    .setMimeType(ContentService.MimeType.JSON);
}


