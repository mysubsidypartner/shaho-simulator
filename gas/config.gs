// ============================================================
// config.gs — 社会保険料シミュレーター設定
// ============================================================

var SHAHO_CONFIG = {
  TIMEZONE: 'Asia/Tokyo',

  PROP_KEYS: {
    SPREADSHEET_ID: 'SHAHO_SPREADSHEET_ID',
    SHEET_NAME: 'SHAHO_SHEET_NAME'
  },

  DEFAULT_SHEET_NAME: '回答ログ',

  LOG_HEADERS: [
    'timestamp',
    '所在地',
    '生年月日',
    '年齢区分',
    '決算月',
    '月額報酬',
    '年間役員賞与',
    '会社名',
    'お名前',
    '計算結果_合計',
    '計算結果_適正化後',
    '計算結果_削減額',
    '計算結果_内訳'
  ]
};
