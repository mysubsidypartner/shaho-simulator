// ============================================================
// setup.gs — 初回セットアップ
// ============================================================

/**
 * 初回セットアップ（GAS エディタから1回実行）
 * - 回答ログ用スプレッドシートを新規作成（未設定時）
 * - ヘッダー行を作成
 */
function setupAll() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty(SHAHO_CONFIG.PROP_KEYS.SPREADSHEET_ID);
  var ss;

  if (!ssId) {
    ss = SpreadsheetApp.create('社会保険料シミュレーター 回答ログ');
    ssId = ss.getId();
    props.setProperty(SHAHO_CONFIG.PROP_KEYS.SPREADSHEET_ID, ssId);
  } else {
    ss = SpreadsheetApp.openById(ssId);
  }

  setupSheetIfNeeded_();

  return {
    ok: true,
    spreadsheetId: ssId,
    spreadsheetUrl: ss.getUrl(),
    message: 'セットアップ完了。次に Web App をデプロイし、URL を config.js に設定してください。'
  };
}

/**
 * 既存スプレッドシートにバインドする場合
 * @param {string} spreadsheetId
 */
function bindSpreadsheet(spreadsheetId) {
  var id = String(spreadsheetId || '').trim();
  if (!id) {
    throw new Error('スプレッドシート ID を指定してください');
  }
  SpreadsheetApp.openById(id);
  PropertiesService.getScriptProperties().setProperty(
    SHAHO_CONFIG.PROP_KEYS.SPREADSHEET_ID,
    id
  );
  setupSheetIfNeeded_();
  return {
    ok: true,
    spreadsheetId: id,
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/' + id + '/edit'
  };
}
