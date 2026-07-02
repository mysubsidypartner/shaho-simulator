// ============================================================
// Code.gs — Web App エントリポイント
// ============================================================

function doPost(e) {
  try {
    var body = (e && e.postData) ? e.postData.contents : '{}';
    var data = JSON.parse(body);
    appendSubmission_(data);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error('doPost error: ' + err.message);
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('社会保険料シミュレーター API')
    .setMimeType(ContentService.MimeType.TEXT);
}

function appendSubmission_(data) {
  setupSheetIfNeeded_();
  var sheet = getLogSheet_();
  var row = [
    Utilities.formatDate(new Date(), SHAHO_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
    String(data.location || ''),
    String(data.birthDate || ''),
    String(data.ageCategory || ''),
    data.fiscalMonth || '',
    data.monthlyPay || '',
    data.annualBonus || '',
    String(data.companyName || ''),
    String(data.personName || ''),
    data.resultTotal || '',
    data.resultOptimizedTotal || '',
    data.resultSavings || '',
    String(data.resultBreakdown || '')
  ];
  sheet.appendRow(row);
}

function getLogSheet_() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty(SHAHO_CONFIG.PROP_KEYS.SPREADSHEET_ID);
  if (!ssId) {
    throw new Error('Script Property SHAHO_SPREADSHEET_ID が未設定です');
  }
  var sheetName = props.getProperty(SHAHO_CONFIG.PROP_KEYS.SHEET_NAME) || SHAHO_CONFIG.DEFAULT_SHEET_NAME;
  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('シートが見つかりません: ' + sheetName);
  }
  return sheet;
}

function setupSheetIfNeeded_() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty(SHAHO_CONFIG.PROP_KEYS.SPREADSHEET_ID);
  if (!ssId) return;
  var sheetName = props.getProperty(SHAHO_CONFIG.PROP_KEYS.SHEET_NAME) || SHAHO_CONFIG.DEFAULT_SHEET_NAME;
  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHAHO_CONFIG.LOG_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, SHAHO_CONFIG.LOG_HEADERS.length).setFontWeight('bold');
  }
}

/**
 * 初回セットアップ用: スプレッドシート ID を Script Properties に保存
 * @param {string} spreadsheetId
 */
function setSpreadsheetId(spreadsheetId) {
  PropertiesService.getScriptProperties().setProperty(
    SHAHO_CONFIG.PROP_KEYS.SPREADSHEET_ID,
    String(spreadsheetId || '').trim()
  );
  setupSheetIfNeeded_();
}

function testAppendRow() {
  appendSubmission_({
    location: '東京都',
    birthDate: '1980-01-01',
    ageCategory: '40歳以上',
    fiscalMonth: 3,
    monthlyPay: 300000,
    annualBonus: 1000000,
    companyName: 'テスト株式会社',
    personName: '山田太郎',
    resultTotal: 1380000,
    resultOptimizedTotal: 998928,
    resultSavings: 381072,
    resultBreakdown: '{}'
  });
}
