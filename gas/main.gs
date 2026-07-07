// ============================================================
// main.gs — 社会保険料シミュレーター（このファイル1つで完結）
// ============================================================

var SHAHO_CONFIG = {
  TIMEZONE: 'Asia/Tokyo',
  LOG_HEADERS: [
    '送信日時',
    '所在地',
    '生年月日',
    '年齢区分',
    '決算月',
    '月額報酬',
    '賞与回数',
    '賞与1回目',
    '賞与2回目',
    '賞与3回目',
    '年間役員賞与',
    '年間報酬総額',
    '会社名',
    'お名前',
    '計算結果_合計',
    '計算結果_適正化後',
    '計算結果_削減額',
    '適正化後_月額報酬',
    '適正化後_年間賞与',
    '計算結果_内訳'
  ]
};

// --- Web App ---

function doGet(e) {
  return ContentService.createTextOutput('社会保険料シミュレーター API')
    .setMimeType(ContentService.MimeType.TEXT);
}

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

// --- セットアップ・テスト ---

function setupAll() {
  setupSheetIfNeeded_();
  var ss = getSpreadsheet_();
  var sheet = getLogSheet_();
  return {
    ok: true,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    sheetName: sheet.getName(),
    message: 'セットアップ完了。Web App をデプロイしてください。'
  };
}

function testAppendRow() {
  appendSubmission_({
    location: '東京都',
    birthDate: '1980-01-01',
    ageCategory: '40歳以上',
    fiscalMonth: 3,
    monthlyPay: 300000,
    bonusCount: 2,
    bonusPayments: [500000, 500000],
    annualBonus: 1000000,
    annualRemuneration: 4600000,
    companyName: 'テスト株式会社',
    personName: '山田太郎',
    resultTotal: 1380000,
    resultOptimizedTotal: 1251900,
    resultSavings: 128100,
    optimizedMonthlyPay: 200000,
    optimizedAnnualBonus: 2200000,
    resultBreakdown: '{}'
  });
}

// --- 内部処理 ---

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

function upgradeLogHeadersIfNeeded_(sheet) {
  if (sheet.getLastRow() === 0) {
    return;
  }
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (headers.indexOf('賞与回数') >= 0) {
    return;
  }
  if (headers.indexOf('月額報酬') < 0) {
    return;
  }

  sheet.insertColumnsAfter(6, 4);
  sheet.getRange(1, 7, 1, 4).setValues([['賞与回数', '賞与1回目', '賞与2回目', '賞与3回目']]);
  sheet.getRange(1, 1, 1, SHAHO_CONFIG.LOG_HEADERS.length).setFontWeight('bold');
}

function appendSubmission_(data) {
  setupSheetIfNeeded_();
  var sheet = getLogSheet_();
  upgradeLogHeadersIfNeeded_(sheet);
  var payments = parseBonusPayments_(data);
  sheet.appendRow([
    Utilities.formatDate(new Date(), SHAHO_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
    String(data.location || ''),
    String(data.birthDate || ''),
    String(data.ageCategory || ''),
    data.fiscalMonth || '',
    data.monthlyPay || '',
    data.bonusCount != null && data.bonusCount !== '' ? data.bonusCount : '',
    payments[0] || '',
    payments[1] || '',
    payments[2] || '',
    data.annualBonus || '',
    data.annualRemuneration || '',
    String(data.companyName || ''),
    String(data.personName || ''),
    data.resultTotal || '',
    data.resultOptimizedTotal || '',
    data.resultSavings || '',
    data.optimizedMonthlyPay || '',
    data.optimizedAnnualBonus || '',
    String(data.resultBreakdown || '')
  ]);
}

function getSpreadsheet_() {
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error('スプレッドシートを開いた状態で実行してください。');
}

function getLogSheet_() {
  var sheets = getSpreadsheet_().getSheets();
  if (!sheets.length) throw new Error('シートがありません');
  return sheets[0];
}

function setupSheetIfNeeded_() {
  var sheet = getLogSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHAHO_CONFIG.LOG_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, SHAHO_CONFIG.LOG_HEADERS.length).setFontWeight('bold');
    return;
  }
  upgradeLogHeadersIfNeeded_(sheet);
}
