# 本番セットアップ手順

**1つのスプレッドシートに GAS を入れて完結**する構成です。  
回答ログも同じファイルの先頭シートに追記されます。

## 全体の流れ

```
① スプレッドシートを開く → 拡張機能 → Apps Script
② gas/ のコードを貼り付け → setupAll 実行
③ Web App をデプロイ → config.js に URL 設定 → push
```

---

## ① スプレッドシートに GAS をセットアップ

### A. スプレッドシートを開く

使うスプレッドシートを開きます（例）:

https://docs.google.com/spreadsheets/d/1_SuKZ7XUFqPX6-LhmeyjV8wQoVh21QVCGrWoAqsjD-I/edit

> **1シート完結**: 先頭のシート（「シート1」など）に回答ログが書き込まれます。  
> 余計なシートは削除して OK です。

### B. Apps Script を開く

1. メニュー **拡張機能 → Apps Script**
2. **既存の `.gs` ファイルをすべて削除**（`Code.gs` / `config.gs` など分割版が残っている場合も含む）
3. ファイルを **1つだけ** 作成し、**`gas/main.gs` の内容をすべて貼り付け**（ファイル名は `main.gs` または `コード.gs` で OK）
4. `appsscript.json` を使う場合は **プロジェクトの設定** → **「appsscript.json」マニフェスト ファイルをエディタで表示する」** を ON にして上書き

> ⚠️ **`main.gs` 1ファイルのみ** を使ってください。複数ファイルに分けると関数が重複し、ログの列ずれや `appendSubmission_ is not defined` の原因になります。

### C. 初回セットアップ

1. **スプレッドシートのタブを開いたまま** GAS エディタで `setupAll` を実行
2. 先頭シートの1行目にヘッダー（20列）が作成される
3. 既存シートでヘッダーがずれている場合は `repairLogSheet` を実行

### D. 動作テスト

1. `testAppendRow` を実行
2. 先頭シートにテスト行が1行追加されれば OK

### E. Web App をデプロイ

1. **デプロイ → 新しいデプロイ → ウェブアプリ**
2. 実行ユーザー: **自分**
3. アクセス: **全員**
4. 表示された URL（`.../exec`）をコピー

---

## ② config.js に GAS URL を設定

```javascript
const APP_CONFIG = {
  GAS_ENDPOINT: 'https://script.google.com/macros/s/xxxxxxxx/exec',
};
```

---

## ③ GitHub に push

```bash
cd shaho-simulator
git add public/js/config.js
git commit -m "Set GAS endpoint"
git push
```

公開 URL: https://mysubsidypartner.github.io/shaho-simulator/

---

## 構成イメージ

```
社会保険料シミュレーター 回答ログ.xlsx（Google スプレッドシート）
├── シート1  ← 回答ログ（ヘッダー + 1送信1行）
└── Apps Script（拡張機能）← Web App API
```

フォーム画面は GitHub Pages、データ保存はこのスプレッドシート1ファイルで完結します。

---

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| スプレッドシートに行が追加されない | Web App を「全員」で再デプロイ。`config.js` の URL を確認 |
| `スプレッドシートが見つかりません` | スプレッドシートを開いた状態で `setupAll` を実行 |
| ヘッダーがずれている | `repairLogSheet` を実行（K〜N 列の空列を削除して1行目を20列に揃える） |
