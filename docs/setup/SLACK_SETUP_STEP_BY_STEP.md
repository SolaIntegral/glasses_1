# Slack通知セットアップ - ステップバイステップガイド

## ステップ1: Slack Appを作成

### 1-1. Slack APIページにアクセス
1. ブラウザで https://api.slack.com/apps を開く
2. 右上の「Your Apps」をクリック

### 1-2. 新しいアプリを作成
1. 「Create New App」ボタンをクリック
2. **「From scratch」を選択**
3. App名: `Booking System Bot` を入力
4. Pick a workspace: 使用するワークスペースを選択
5. 「Create App」をクリック

## ステップ2: Bot Token Scopesを設定

### 2-1. OAuth & Permissionsに移動
1. 左メニューから「OAuth & Permissions」をクリック

### 2-2. Bot Token Scopesを追加
「Bot Token Scopes」セクションの「Add an OAuth Scope」をクリックし、以下のスコープを追加：

1. `chat:write` - メッセージを送信
2. `im:write` - DMを送信
3. `im:read` - DMを読む
4. `users:read` - ユーザー情報を取得

追加後、以下のようになります：
```
Bot Token Scopes
├ chat:write
├ im:write
├ im:read
└ users:read
```

### 2-3. Workspaceにインストール
1. ページ上部の「Install to Workspace」ボタンをクリック
2. 権限を確認して「許可する」をクリック

### 2-4. Bot User OAuth Tokenをコピー
「Bot User OAuth Token」の値をコピー（`xoxb-`で始まるトークン）
**重要**: このトークンは必ず安全に保管してください

## ステップ3: Incoming Webhooksを設定（オプション）

### 3-1. Incoming Webhooksを有効化
1. 左メニューから「Incoming Webhooks」をクリック
2. 「Activate Incoming Webhooks」を有効化

### 3-2. Webhook URLを作成
1. 「Add New Webhook to Workspace」をクリック
2. 投稿先のチャンネルまたはDMを選択（例: `#booking-notifications`）
3. 「Allow」をクリック
4. **Webhook URL**をコピー（`https://hooks.slack.com/services/...`）

## ステップ4: Google Apps Scriptの設定

### 4-1. GASプロジェクトを作成
1. https://script.google.com にアクセス
2. 左上の「新しいプロジェクト」をクリック
3. プロジェクト名を `SlackBookingNotifier` に変更

### 4-2. コードを貼り付け
`SLACK_WEBHOOK_GUIDE.md` のコードを `Code.gs` に貼り付け

### 4-3. トークンを設定
コード内の以下の部分を編集：

```javascript
const SLACK_BOT_TOKEN = 'xoxb-your-bot-token'; // ← ステップ2-4でコピーしたトークンを貼り付け
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'; // ← ステップ3-2でコピーしたURLを貼り付け
```

### 4-4. デプロイ
1. 「デプロイ」メニューから「新しいデプロイ」をクリック
2. 種類の横にある歯車アイコンをクリック
3. 「ウェブアプリ」を選択
4. 以下の設定：
   - 説明: `Slack Notifier v1`
   - 次のユーザーとして実行: `自分`
   - アクセスできるユーザー: `全員`
5. 「デプロイ」をクリック
6. 「承認が必要です」と表示されたら「承認」をクリック
7. 「アクセスを許可」をクリック
8. **ウェブアプリのURL**をコピー（`https://script.google.com/macros/s/...`）

## ステップ5: FirestoreにSlack Member IDを設定

### 5-1. Slack Member IDを取得

**方法1: Slack APIを使用（推奨）**
1. https://api.slack.com/methods/users.list/test にアクセス
2. トークンに自分のトークンを使用（「OAuth & Permissions」ページから取得）
3. 「Test Method」をクリック
4. 結果のJSONから該当するメンバーの`id`をコピー（`U`で始まるID）

**方法2: Slackアプリから**
1. Slackでユーザー名の上にマウスをホバー
2. プロフィールを開く
3. 「その他」→「メンバーIDをコピー」

### 5-2. Firestoreに設定
1. Firebase Console で Firestore を開く
2. `instructors` コレクションを選択
3. 講師のドキュメントを開く
4. `slackMemberId` フィールドを追加（値は上記で取得したID）

## ステップ6: 環境変数を設定（オプション）

`.env.local` に追加：

```bash
NEXT_PUBLIC_GAS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## テスト

1. 生徒として予約を作成
2. 講師のSlack DMに通知が届くことを確認
3. 通知には以下の情報が含まれていることを確認：
   - 生徒名
   - 日時
   - Google Meetリンク

## トラブルシューティング

### 通知が届かない
1. GASの実行ログを確認: 実行 → 実行履歴
2. SlackのWebhook URLが正しいか確認
3. Firestoreで`slackMemberId`が設定されているか確認

### GASの実行エラー
1. ログを確認: 実行 → ログ
2. 権限を確認: 承認が必要な場合は「権限の確認」を実行
