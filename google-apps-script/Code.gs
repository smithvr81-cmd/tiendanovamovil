const SPREADSHEET_ID = '1q6VEJY6yd5rjUHESK64aM-MpXLfUj72Ph8BGPTXw3lw';
const SHEET_NAME = 'Leads';

function doPost(e) {
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
      /^[a-zA-Z0-9_-]{1,80}$/.test(String(data.lead_id || '')) ? String(data.lead_id) : ''
    ]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'Tiendanovamovil Leads' }))
    .setMimeType(ContentService.MimeType.JSON);
}

