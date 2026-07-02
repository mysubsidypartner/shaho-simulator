# 社会保険料 適正化シミュレーター

Web フォームで経営者の報酬情報を入力し、社会保険料を自動計算・適正化シミュレーションを行うツールです。  
[シャホコン](https://advance.shahocon55.com/) を参考に、無印良品風のミニマル UI で実装しています。

## 構成

```
shaho-simulator/
├── public/          # フロントエンド（静的ホスティング可）
│   ├── index.html
│   ├── styles.css
│   └── js/
│       ├── rates.js       # 料率・等級表（Excel から生成）
│       ├── rates-data.json
│       ├── calc.js        # 計算ロジック
│       └── form.js        # フォーム制御・送信
├── gas/             # Google Apps Script（回答ログ蓄積）
│   ├── Code.gs
│   ├── config.gs
│   └── appsscript.json
└── tools/
    └── extract-rates.py   # Excel → rates-data.json 変換
```

## 機能

- 5 ステップのマルチステップフォーム
- 東京都 / 大阪府 × 40 歳以上 / 40 歳未満の 4 分類で料率を自動選択
- 令和 8 年度の Excel 計算ロジックを踏襲した社会保険料計算
- 年間報酬総額を維持したまま月額・賞与配分を最適化し、削減額を表示
- GAS Web App 経由で Google スプレッドシートに回答を自動蓄積

## ローカル確認

```bash
cd public
python3 -m http.server 8080
# http://localhost:8080 を開く
```

## フロントエンドのデプロイ

`public/` ディレクトリをそのまま静的ホスティングします。

- GitHub Pages
- Netlify
- Cloudflare Pages

デプロイ後、`public/js/form.js` の `CONFIG.GAS_ENDPOINT` に GAS Web App の URL を設定してください。

## GAS のセットアップ

### 1. スプレッドシートを作成

新規 Google スプレッドシートを作成し、URL から ID を控えます。

### 2. Apps Script プロジェクトを作成

1. [Google Apps Script](https://script.google.com/) で新規プロジェクトを作成
2. `gas/` 配下のファイルをコピー
3. **プロジェクトの設定 → Script Properties** に以下を追加:

| キー | 値 |
|---|---|
| `SHAHO_SPREADSHEET_ID` | スプレッドシート ID |
| `SHAHO_SHEET_NAME` | `回答ログ`（任意。省略可） |

4. エディタで `setSpreadsheetId('YOUR_SPREADSHEET_ID')` を一度実行してヘッダー行を作成

### 3. Web App としてデプロイ

1. **デプロイ → 新しいデプロイ → 種類: ウェブアプリ**
2. 実行ユーザー: **自分**
3. アクセス: **全員**（匿名ユーザーを含む）
4. デプロイ URL を `form.js` の `GAS_ENDPOINT` に設定

### 4. 動作確認

GAS エディタで `testAppendRow()` を実行し、スプレッドシートに行が追加されることを確認します。

## 料率データの更新

Excel ファイルを更新した場合:

```bash
python3 tools/extract-rates.py \
  "/path/to/社会保険料シミュレーション_東京都版_令和8年度_40歳以上.xlsx" \
  "/path/to/社会保険料シミュレーション_東京都版_令和8年度_40歳未満.xlsx" \
  "/path/to/社会保険料シミュレーション_大阪府版_令和8年度_40歳以上.xlsx" \
  "/path/to/社会保険料シミュレーション_大阪府版_令和8年度_40歳未満.xlsx"
```

`public/js/rates-data.json` と `rates.js` が再生成されます。

## 計算ロジック

- **標準報酬月額**: 月額報酬から等級表を XLOOKUP（近似一致）で参照
- **賞与**: 千円未満切り捨て、健保は年間 573 万円上限、厚生年金は 1 回 150 万円上限
- **年間保険料合計**: `(月額健保+介護+子育て+年金) × 12 + 賞与分`
- **適正化**: 年間報酬総額固定のまま月額報酬を変化させ、年間保険料が最小となる配分を探索

## 注意事項

- 本ツールはシミュレーションであり、実際の社会保険料申告・手続きの代替ではありません
- 決算月は現時点ではログ記録のみ（計算には未使用）
- 年齢区分は本日時点の満年齢で判定（40 歳以上で介護保険料あり）
- メールアドレス・電話番号は収集しません
