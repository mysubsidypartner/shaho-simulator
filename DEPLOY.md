# 本番セットアップ手順

依頼者確認済みのシミュレーターを、回答ログ付きの本番環境にする手順です。

## 全体の流れ

```
① GAS セットアップ（スプレッドシート + Web App）
② config.js に GAS URL を設定
③ GitHub に push → 自動で公開サイト更新
```

---

## ① GAS のセットアップ（約10分）

### A. スクリプトプロジェクトを作成

1. [Google Apps Script](https://script.google.com/) を開く
2. **新しいプロジェクト** を作成
3. プロジェクト名を「社会保険料シミュレーター」などに変更
4. `gas/` フォ下のファイルをすべてコピー
   - `Code.gs`
   - `config.gs`
   - `setup.gs`
   - `appsscript.json`（マニフェストは **プロジェクトの設定 → 「appsscript.json」マニフェスト ファイルをエディタで表示する」** を ON にしてから上書き）

### B. 初回セットアップを実行

1. GAS エディタで関数 `setupAll` を選択 → **実行**
2. 初回は Google の承認画面が出るので許可
3. **実行ログ** にスプレッドシート URL が表示される → ブックマークしておく

> 既存のスプレッドシートを使う場合は `bindSpreadsheet('スプレッドシートID')` を実行

### C. 動作テスト

1. 関数 `testAppendRow` を実行
2. スプレッドシートの「回答ログ」シートに1行追加されれば OK

### D. Web App をデプロイ

1. **デプロイ → 新しいデプロイ**
2. 種類: **ウェブアプリ**
3. 設定:
   - 説明: `回答ログ API v1`
   - 実行ユーザー: **自分**
   - アクセスできるユーザー: **全員**
4. **デプロイ** をクリック
5. 表示された **ウェブアプリ URL**（`https://script.google.com/macros/s/.../exec`）をコピー

---

## ② フロントエンドに GAS URL を設定

`public/js/config.js` を開き、URL を貼り付けます。

```javascript
const APP_CONFIG = {
  GAS_ENDPOINT: 'https://script.google.com/macros/s/xxxxxxxx/exec',
};
```

---

## ③ GitHub に push（公開サイトを更新）

```bash
cd shaho-simulator
git add .
git commit -m "Connect GAS endpoint for answer logging"
git push
```

数分後、公開 URL が更新されます。

**公開 URL:** https://mysubsidypartner.github.io/shaho-simulator/

---

## 動作確認チェックリスト

- [ ] フォームを最後まで入力して「診断する」
- [ ] 診断結果が表示される
- [ ] スプレッドシートに1行追加される
- [ ] 追加された行の内容が入力値と一致する

---

## clasp を使う場合（任意）

```bash
npm install -g @google/clasp
clasp login
cd shaho-simulator
cp .clasp.json.example .clasp.json
# .clasp.json の scriptId を GAS プロジェクト ID に変更
clasp push
```

---

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| スプレッドシートに行が追加されない | `config.js` の URL が正しいか確認。Web App を「全員」アクセスで再デプロイ |
| `SHAHO_SPREADSHEET_ID が未設定` | `setupAll()` を再実行 |
| ヘッダーが英語のまま | `回答ログ` シートを削除して `setupAll()` を再実行 |

---

## 本番 URL

| 用途 | URL |
|------|-----|
| シミュレーター（ユーザー向け） | https://mysubsidypartner.github.io/shaho-simulator/ |
| 回答ログ | setupAll 実行時に作成されたスプレッドシート |
| GAS 管理 | https://script.google.com/ |
