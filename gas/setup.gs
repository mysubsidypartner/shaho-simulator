// ============================================================
// setup.gs — 初回セットアップ（1シート完結）
// ============================================================

/**
 * 初回セットアップ
 * 対象スプレッドシートの先頭シートにヘッダー行を作成するだけ
 */
function setupAll() {
  setupSheetIfNeeded_();
  var ss = getSpreadsheet_();
  var sheet = getLogSheet_();

  return {
    ok: true,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    sheetName: sheet.getName(),
    message: 'セットアップ完了。Web App をデプロイし、URL を config.js に設定してください。'
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
