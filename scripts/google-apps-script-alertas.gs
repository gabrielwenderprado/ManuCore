/**
 * Central de Avisos da Produção para Google Sheets.
 *
 * 1. Crie uma planilha Google chamada PCM - Avisos da Produção.
 * 2. Abra Extensões > Apps Script e cole este arquivo.
 * 3. Implante como Aplicativo Web, executando como você e permitindo acesso a qualquer pessoa com o link.
 * 4. Copie a URL da implantação para data/alertas-config.json no campo endpoint.
 *
 * A API aceita:
 * GET  /alerts       -> { alerts: [...] }
 * POST /alerts       -> grava { alerts: [...] }
 */
const NOME_ABA = 'Alertas';
const CABECALHOS = ['id', 'createdAt', 'updatedAt', 'status', 'leader', 'line', 'code', 'description', 'message', 'stock', 'safety', 'demand', 'orders', 'suggestedPurchase', 'analyst', 'family', 'obtentionType', 'unit', 'historyJson'];

function getSheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(NOME_ABA);
  if (!sheet) sheet = book.insertSheet(NOME_ABA);
  if (sheet.getLastRow() === 0) sheet.appendRow(CABECALHOS);
  return sheet;
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return json_({ alerts: readAlerts_() });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const alerts = Array.isArray(payload.alerts) ? payload.alerts : [];
    writeAlerts_(alerts);
    return json_({ ok: true, count: alerts.length });
  } catch (error) {
    return json_({ ok: false, error: String(error.message || error) });
  }
}

function readAlerts_() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  return values.slice(1).filter(row => row[0]).map(row => ({
    id: row[0], createdAt: row[1], updatedAt: row[2], status: row[3], leader: row[4], line: row[5],
    code: row[6], description: row[7], message: row[8], stock: Number(row[9]) || 0, safety: Number(row[10]) || 0,
    demand: Number(row[11]) || 0, orders: Number(row[12]) || 0, suggestedPurchase: Number(row[13]) || 0,
    analyst: row[14], family: row[15], obtentionType: row[16], unit: row[17], history: parseHistory_(row[18])
  }));
}

function parseHistory_(value) {
  try { return value ? JSON.parse(value) : []; } catch (error) { return []; }
}

function writeAlerts_(alerts) {
  const sheet = getSheet_();
  const rows = alerts.map(alert => [
    alert.id || '', alert.createdAt || '', new Date().toISOString(), alert.status || 'Novo', alert.leader || '', alert.line || '',
    alert.code || '', alert.description || '', alert.message || '', Number(alert.stock) || 0, Number(alert.safety) || 0,
    Number(alert.demand) || 0, Number(alert.orders) || 0, Number(alert.suggestedPurchase) || 0, alert.analyst || '',
    alert.family || '', alert.obtentionType || '', alert.unit || 'UN', JSON.stringify(alert.history || [])
  ]);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, CABECALHOS.length).clearContent();
  if (rows.length) sheet.getRange(2, 1, rows.length, CABECALHOS.length).setValues(rows);
}
