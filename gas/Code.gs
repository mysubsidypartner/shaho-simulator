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
    data.annualRemuneration || '',
    String(data.companyName || ''),
    String(data.personName || ''),
    data.resultTotal || '',
    data.resultOptimizedTotal || '',
    data.resultSavings || '',
    data.optimizedMonthlyPay || '',
    data.optimizedAnnualBonus || '',
    String(data.resultBreakdown || '')
  ];
  sheet.appendRow(row);
}
