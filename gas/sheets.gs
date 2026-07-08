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

function parseBonusPayments_(data) {
  var payments = [];
  if (!data || data.bonusPayments == null || data.bonusPayments === '') {
    return payments;
  }
  if (typeof data.bonusPayments === 'string') {
    try {
      payments = JSON.parse(data.bonusPayments);
    } catch (err) {
      payments = [];
    }
  } else if (Array.isArray(data.bonusPayments)) {
    payments = data.bonusPayments;
  }
  return payments
    .map(function (value) { return Number(value); })
    .filter(function (value) { return Number.isFinite(value) && value > 0; });
}

function repairHeaderGap_(sheet) {
  if (sheet.getLastRow() === 0) {
    return false;
  }
  var lastCol = Math.max(sheet.getLastColumn(), SHAHO_CONFIG.LOG_HEADERS.length);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var bonus3Idx = headers.indexOf('賞与3回目');
  var annualIdx = headers.indexOf('年間役員賞与');
  if (bonus3Idx >= 0 && annualIdx === bonus3Idx + 5) {
    sheet.deleteColumns(bonus3Idx + 2, 4);
    return true;
  }
  return false;
}

function applyLogHeaders_(sheet) {
  sheet.getRange(1, 1, 1, SHAHO_CONFIG.LOG_HEADERS.length).setValues([SHAHO_CONFIG.LOG_HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, SHAHO_CONFIG.LOG_HEADERS.length).setFontWeight('bold');
}

function upgradeLogHeadersIfNeeded_(sheet) {
  if (sheet.getLastRow() === 0) {
    return;
  }
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (headers.indexOf('賞与回数') >= 0) {
    if (repairHeaderGap_(sheet)) {
      applyLogHeaders_(sheet);
    }
    return;
  }
  if (headers.indexOf('月額報酬') < 0) {
    return;
  }

  sheet.insertColumnsAfter(6, 4);
  applyLogHeaders_(sheet);
}

function setupSheetIfNeeded_() {
  var sheet = getLogSheet_();
  if (sheet.getLastRow() === 0) {
    applyLogHeaders_(sheet);
    return;
  }
  upgradeLogHeadersIfNeeded_(sheet);
}
