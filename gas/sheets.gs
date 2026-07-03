// ============================================================
// sheets.gs — スプレッドシート操作（1ファイル・1シート完結）
// ============================================================

/**
 * 操作中のスプレッドシートを取得
 * スプレッドシートにバインドした GAS から実行する想定
 */
function getSpreadsheet_() {
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }

  var ssId = PropertiesService.getScriptProperties().getProperty(
    SHAHO_CONFIG.PROP_KEYS.SPREADSHEET_ID
  );
  if (ssId) {
    return SpreadsheetApp.openById(ssId);
  }

  throw new Error(
    'スプレッドシートが見つかりません。' +
    '対象のスプレッドシートを開き、「拡張機能 → Apps Script」から実行してください。'
  );
}

/**
 * 回答ログを書き込むシート（先頭の1シートのみ使用）
 */
function getLogSheet_() {
  var ss = getSpreadsheet_();
  var sheets = ss.getSheets();
  if (!sheets.length) {
    throw new Error('シートがありません');
  }
  return sheets[0];
}

function setupSheetIfNeeded_() {
  var sheet = getLogSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHAHO_CONFIG.LOG_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, SHAHO_CONFIG.LOG_HEADERS.length).setFontWeight('bold');
  }
}
