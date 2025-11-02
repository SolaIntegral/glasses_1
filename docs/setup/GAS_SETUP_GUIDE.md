# GASセットアップ完全ガイド

このガイドでは、Google Apps Scriptを使用してSlack通知を送信するための設定手順を説明します。

## 📋 準備するもの

1. **Slack App**: Bot Tokenが必要
2. **Slack Member ID**: 通知先の講師のSlack ID（`U`で始まるID）
3. **Google Apps Script**: Googleアカウントが必要

---

## ステップ1: GASプロジェクトを作成

### 1-1. Google Apps Scriptにアクセス

1. ブラウザで https://script.google.com を開く
2. Googleアカウントでログイン

### 1-2. 新しいプロジェクトを作成

1. 左上の「新しいプロジェクト」をクリック
2. プロジェクト名を `SlackBookingNotifier` に変更（プロジェクト名のテキストをクリックして変更）

---

## ステップ2: コードを貼り付ける

### 2-1. コードを取得

`GAS_SLACK_CODE.js` ファイルの内容をすべてコピーします。

### 2-2. GASエディタに貼り付け

1. `Code.gs` の内容をすべて削除
2. コピーしたコードを貼り付け
3. Ctrl+S（または Cmd+S）で保存

---

## ステップ3: Slack認証情報を設定

### 3-1. Bot Tokenを設定

```javascript
const SLACK_BOT_TOKEN = 'xoxb-your-bot-token'; // ← ここを変更
```

**置き換える値**: Slack Appの「OAuth & Permissions」ページにある「Bot User OAuth Token」

**取得方法**:
1. https://api.slack.com/apps にアクセス
2. 作成したSlack Appを選択
3. 左メニューから「OAuth & Permissions」をクリック
4. 「Bot User OAuth Token」の値をコピー（`xoxb-`で始まるトークン）

### 3-2. Webhook URLを設定（オプション）

```javascript
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'; // ← ここを変更
```

**置き換える値**: Slack Appの「Incoming Webhooks」で作成したWebhook URL

**取得方法**:
1. 左メニューから「Incoming Webhooks」をクリック
2. 「Activate Incoming Webhooks」を有効化
3. 「Add New Webhook to Workspace」をクリック
4. 投稿先のチャンネルを選択（例: `#booking-notifications`）
5. 「Allow」をクリック
6. **Webhook URL**をコピー

---

## ステップ4: 初回テスト

### 4-1. テスト用関数を編集

コードの最後にある `testNotification()` 関数を編集：

```javascript
function testNotification() {
  const testData = {
    type: 'booking',
    instructorSlackMemberId: 'YOUR_SLACK_MEMBER_ID', // ← 自分のSlack Member IDに変更
    studentName: 'テスト生徒',
    startTime: '2024年12月20日 14:00',
    meetingUrl: 'https://meet.google.com/kdd-mtnd-eyc'
  };
  
  sendBookingNotification(testData);
}
```

**Slack Member IDの取得方法**:
- 方法1: https://api.slack.com/methods/users.list/test で取得
- 方法2: Slackアプリでユーザー名の上にマウスをホバー → 「その他」→「メンバーIDをコピー」

### 4-2. テストを実行

1. 関数を選択: エディタ上部の関数選択ドロップダウンから `testNotification` を選択
2. 「実行」ボタンをクリック
3. 初回は「承認が必要です」と表示されるので、「承認」をクリック
4. 自分のGoogleアカウントを選択
5. 「詳細」→「（プロジェクト名）に移動」をクリック
6. 「許可」をクリック

### 4-3. 結果を確認

1. エディタで「実行」→「実行ログ」を選択
2. エラーがないか確認
3. 自分のSlack DMに通知が届いているか確認

---

## ステップ5: Webアプリとしてデプロイ

### 5-1. デプロイを開始

1. 右上の「デプロイ」ボタンをクリック
2. 「新しいデプロイ」を選択

### 5-2. デプロイ設定

1. 種類の横にある歯車アイコンをクリック
2. 「ウェブアプリ」を選択
3. 設定項目：
   - **説明**: `Slack Notifier v1`
   - **次のユーザーとして実行**: `自分`
   - **アクセスできるユーザー**: `全員`
4. 「デプロイ」をクリック

### 5-3. 承認

1. 「承認が必要です」と表示されたら「承認」をクリック
2. Googleアカウントを選択
3. 「詳細」→「（プロジェクト名）に移動」
4. 「アクセスを許可」をクリック

### 5-4. WebアプリのURLをコピー

デプロイが完了すると、**ウェブアプリのURL**が表示されます。

```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

**重要**: このURLを必ずコピーして保存してください！

---

## ステップ6: 環境変数を設定

### 6-1. .env.localファイルに追加

プロジェクトのルートディレクトリ（`glasses_1`）にある `.env.local` ファイルに以下を追加：

```bash
NEXT_PUBLIC_GAS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

**⚠️ `YOUR_SCRIPT_ID` を実際のスクリプトIDに置き換えてください**

### 6-2. 再ビルドとデプロイ

```bash
# ビルド
npm run build

# デプロイ
firebase deploy --only hosting
```

---

## ステップ7: FirestoreにSlack Member IDを設定

### 7-1. 各講師のSlack Member IDを取得

各講師のSlack Member IDを取得してください（`U`で始まるID）

### 7-2. Firestoreに設定

1. Firebase Console で Firestore を開く
2. `instructors` コレクションを選択
3. 講師のドキュメントを開く
4. `slackMemberId` フィールドを追加（型: string）
5. 値を入力（例: `U01234567`）
6. 「更新」をクリック

---

## 🎉 完了！

これで、予約システムからSlack通知が送信されるようになりました。

---

## 📊 通知の動作確認

1. 生徒として予約を作成
2. 講師のSlack DMに通知が届くことを確認
3. 通知には以下の情報が含まれていることを確認：
   - 📅 新しい予約があります
   - 生徒名
   - 日時
   - Google Meetリンク

---

## 🐛 トラブルシューティング

### 通知が届かない

1. **GASの実行ログを確認**
   - Google Apps Script → 実行 → 実行履歴
   - エラーがあるか確認

2. **Slack Member IDが正しいか確認**
   - Firestoreで`slackMemberId`が正しく設定されているか
   - 値は`U`で始まるIDである必要があります

3. **Bot Tokenが正しいか確認**
   - Slack Appの「OAuth & Permissions」ページで確認
   - Workspaceにインストールされているか確認

### エラー: "Error: Failed to open DM channel"

- **原因**: Bot Tokenの権限が不足している
- **解決策**: 
  1. Slack Appの「OAuth & Permissions」ページに移動
  2. 「Bot Token Scopes」に以下があるか確認：
     - `chat:write`
     - `im:write`
     - `im:read`
     - `users:read`
  3. なければ追加して、Workspaceに再インストール

### エラー: "Error: Invalid token"

- **原因**: Bot Tokenが間違っている、または期限切れ
- **解決策**: 
  1. Slack Appの「OAuth & Permissions」ページでBot Tokenを再確認
  2. 必要に応じて再生成

### GASのWebhook URLにアクセスできない

- **原因**: アクセス権限の設定が間違っている
- **解決策**:
  1. GASの「デプロイ」→「管理デプロイ」から設定を確認
  2. 「アクセスできるユーザー」が「全員」になっているか確認
  3. 新しくデプロイし直す

---

## 📝 補足情報

### デプロイバージョン

GASのコードを更新した場合、新しいバージョンとしてデプロイする必要があります：

1. 「デプロイ」→「管理デプロイ」をクリック
2. 「新規バージョンを編集」をクリック
3. バージョンを選択（例: `2`）
4. 「デプロイ」をクリック

**重要**: WebアプリのURLは変更されません

### 実行ログの確認

GASで何が起こっているかを確認するには：

1. エディタで「実行」→「ログ」をクリック
2. または「実行」→「実行履歴」をクリック
3. 実行を選択して、ログを確認

### 無料プランの制限

- **Google Apps Script**: 1日6分の実行時間制限
- **Slack**: Incoming Webhooks/Bot APIの使用に制限なし

**予約数が月100件の場合**: 実質的に無料で使用可能

---

## 🚀 次のステップ

- [ ] 各講師のSlack Member IDを取得して設定
- [ ] テスト通知を送信して動作確認
- [ ] .env.localにWebhook URLを設定
- [ ] 再ビルド・デプロイ
- [ ] 実際の予約でテスト

完了したら、すべてチェックマークを付けてください！

