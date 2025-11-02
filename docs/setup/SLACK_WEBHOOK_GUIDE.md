# Slack通知機能（無料版 - GAS使用）

## 概要

Google Apps Script（GAS）を使用して、**完全無料**でSlack通知を実装する方法です。

## 仕組み

```
予約イベント発生
    ↓
クライアントからSlack Incoming Webhookにリクエスト送信
    ↓
Google Apps Script（GAS）がSlack APIを呼び出し
    ↓
講師のSlack DMに通知が届く
```

## セットアップ手順

### 1. Slack Incoming Webhookの設定

#### 1.1 Slack Appを作成

1. https://api.slack.com/apps にアクセス
2. 「Create New App」→「From scratch」を選択
3. App名: `Booking System`、Workspace: 使用するワークスペースを選択
4. 「Create App」をクリック

#### 1.2 Incoming Webhooksを有効化

1. 左メニューの「Incoming Webhooks」をクリック
2. 「Activate Incoming Webhooks」を有効化
3. 「Add New Webhook to Workspace」をクリック
4. 投稿先のチャンネルまたはDMを選択（例: `#booking-notifications` または `@講師Bot`）
5. 「Allow」をクリック
6. **Webhook URL**をコピー（`https://hooks.slack.com/services/...`）

#### 1.3 OAuth & Permissionsでスコープを設定

1. 左メニューの「OAuth & Permissions」をクリック
2. 「Bot Token Scopes」に以下のスコープを追加：
   - `chat:write` - メッセージを送信
   - `im:write` - DMを送信
   - `im:read` - DMを読む
   - `users:read` - ユーザー情報を取得

3. ページ上部の「Install to Workspace」をクリック
4. 「許可する」をクリック
5. **Bot User OAuth Token**（`xoxb-`で始まる）をコピー

### 2. Google Apps Scriptの設定

#### 2.1 GASプロジェクトを作成

1. https://script.google.com にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名: `SlackBookingNotifier` に変更

#### 2.2 スクリプトを実装

以下のコードを `Code.gs` に貼り付け：

```javascript
// 設定: Slackの認証情報
const SLACK_BOT_TOKEN = 'xoxb-your-bot-token'; // Bot User OAuth Token
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL';

// Slack DMを送信する関数（Bot Token使用）
function sendSlackDM(memberId, message) {
  const url = 'https://slack.com/api/conversations.open';
  const payload = {
    token: SLACK_BOT_TOKEN,
    users: memberId
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  
  if (result.ok && result.channel) {
    // DMチャンネルが開けたので、メッセージを送信
    const chatUrl = 'https://slack.com/api/chat.postMessage';
    const chatPayload = {
      token: SLACK_BOT_TOKEN,
      channel: result.channel.id,
      text: message,
      blocks: JSON.parse(message)
    };
    
    const chatOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(chatPayload)
    };
    
    const chatResponse = UrlFetchApp.fetch(chatUrl, chatOptions);
    return JSON.parse(chatResponse.getContentText());
  } else {
    Logger.log('Failed to open DM channel: ' + result.error);
    return result;
  }
}

// Webhook経由でメッセージを送信（簡易版）
function sendSlackWebhook(message) {
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      text: message
    })
  };
  
  const response = UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
  return response.getContentText();
}

// 予約通知を送信（HTTPリクエストハンドラー）
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // リクエスト内容に応じて処理
    if (data.type === 'booking') {
      sendBookingNotification(data);
    } else if (data.type === 'cancellation') {
      sendCancellationNotification(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error: ' + error);
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 予約通知を送信
function sendBookingNotification(data) {
  const { instructorId, studentName, startTime, meetingUrl } = data;
  
  // 簡易版: Webhook URLに直接送信
  // （より詳細な送信には、instructorIdからSlack Member IDを取得する必要があります）
  const message = JSON.stringify([
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📅 新しい予約があります',
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*生徒名:*\n${studentName}`
        },
        {
          type: 'mrkdwn',
          text: `*日時:*\n${startTime}`
        }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<${meetingUrl}|Google Meet に参加>`
      }
    }
  ]);
  
  sendSlackWebhook(message);
}

// キャンセル通知を送信
function sendCancellationNotification(data) {
  const { studentName, startTime } = data;
  
  const message = JSON.stringify([
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '❌ 予約がキャンセルされました',
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*生徒名:*\n${studentName}`
        },
        {
          type: 'mrkdwn',
          text: `*日時:*\n${startTime}`
        }
      ]
    }
  ]);
  
  sendSlackWebhook(message);
}
```

#### 2.3 Webアプリとしてデプロイ

1. 「デプロイ」→「新しいデプロイ」をクリック
2. 種類で「ウェブアプリ」を選択
3. 説明: `Slack Notifier v1`
4. 次のユーザーとして実行: `自分`
5. アクセスできるユーザー: `全員`
6. 「デプロイ」をクリック
7. **ウェブアプリのURL**をコピー（`https://script.google.com/macros/s/...`）

### 3. FirestoreにSlack Member IDを設定

各講師のFirestoreドキュメントに `slackMemberId` フィールドを追加：

1. Firebase Console で Firestore を開く
2. `instructors` コレクションを選択
3. 講師のドキュメントを開く
4. `slackMemberId` フィールドを追加（値は `U` で始まるSlackのユーザーID）

### 4. Slack Member IDの取得方法

#### 方法1: Slack API

1. https://api.slack.com/methods/users.list/test にアクセス
2. トークンに自分のトークンを使用
3. 「Test Method」をクリック
4. 結果から該当するメンバーの `id` をコピー

#### 方法2: Slackアプリから

1. Slack でユーザー名の上にマウスをホバー
2. プロフィールを開く
3. 「その他」→「メンバーIDをコピー」

### 5. クライアント側の実装

`lib/firebase/bookings.ts` を修正して、GASのWebhook URLを呼び出す：

```typescript
// GAS Webhook URL（環境変数で管理することを推奨）
const GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// 予約通知をGAS経由で送信
const sendNotificationViaGAS = async (data: any) => {
  try {
    const response = await fetch(GAS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to send notification via GAS:', error);
  }
};

// 予約作成時の通知
export const createBooking = async (
  instructorId: string,
  studentId: string,
  // ... 他のパラメータ
): Promise<string> => {
  // ... 既存のコード

  // GAS経由でSlack通知を送信
  await sendNotificationViaGAS({
    type: 'booking',
    instructorId,
    studentName: student?.displayName,
    startTime: startTime.toLocaleString('ja-JP'),
    meetingUrl: 'https://meet.google.com/kdd-mtnd-eyc'
  });

  return bookingRef.id;
};
```

## セキュリティ

### Webhook URLの保護

1. GASのURLにアクセス制限を設定
2. リファラー（Referer）チェックを追加
3. 簡単なAPIキーを実装

```javascript
// GAS側でリファラーチェック
function doPost(e) {
  const referer = e.parameter.referer;
  const expectedReferer = 'https://glasses1-582eb.web.app';
  
  if (referer !== expectedReferer) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid referer' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // ... 処理を続行
}
```

## コスト

- **Google Apps Script**: 無料
  - 実行時間: 6分/日
  - リクエスト数: 無制限
- **Slack**: 無料
  - Incoming Webhooks: 無制限
  - Bot API: 無制限

**予約が月100件の場合**: 実質的に無料

## トラブルシューティング

### 通知が届かない

1. GASの実行ログを確認: 実行 → 実行履歴
2. SlackのWebhook URLが正しいか確認
3. Firestoreの`instructors`コレクションで`slackMemberId`が設定されているか確認

### GASの実行エラー

1. ログを確認: 実行 → ログ
2. 権限を確認: 承認が必要な場合は「権限の確認」を実行

## 今後の改善

1. **トリガー設定**: GASで定期実行して、リマインド通知を送信
2. **テンプレート機能**: 通知メッセージのテンプレートを管理
3. **複数チャンネル対応**: 講師ごとに通知先を設定

## まとめ

- ✅ **完全無料**で動作
- ✅ Google Apps Scriptで実装
- ✅ Slack Incoming Webhooks使用
- ✅ 設定が比較的簡単
- ⚠️ GASの実行時間制限（6分/日）に注意

