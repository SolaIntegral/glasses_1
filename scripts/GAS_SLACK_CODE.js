// 設定: Slackの認証情報
// ⚠️ 以下の値を実際の値に置き換えてください
const SLACK_BOT_TOKEN = 'xoxb-your-bot-token'; // ステップ2-4で取得したBot User OAuth Token
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'; // ステップ3-2で取得したWebhook URL（オプション）

// Slack DMを送信する関数（Bot Token使用）
function sendSlackDM(memberId, messageBlocks) {
  try {
    // 1. DMチャンネルを開く
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
      // 2. メッセージを送信
      const chatUrl = 'https://slack.com/api/chat.postMessage';
      const chatPayload = {
        token: SLACK_BOT_TOKEN,
        channel: result.channel.id,
        blocks: messageBlocks,
        text: '新しい予約通知' // フォールバック用のテキスト
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
  } catch (error) {
    Logger.log('Error sending DM: ' + error);
    return { ok: false, error: error.toString() };
  }
}

// Webhook経由でメッセージを送信（フォールバック用）
function sendSlackWebhook(messageBlocks) {
  try {
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        blocks: messageBlocks
      })
    };
    
    const response = UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
    return response.getContentText();
  } catch (error) {
    Logger.log('Error sending webhook: ' + error);
    return { ok: false, error: error.toString() };
  }
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
  const { instructorSlackMemberId, studentName, startTime, meetingUrl } = data;
  
  // メッセージブロックを作成
  const messageBlocks = [
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
        text: `*ミーティングリンク:*\n<${meetingUrl}|Google Meet に参加>`
      }
    },
    {
      type: 'divider'
    }
  ];
  
  // instructorSlackMemberIdが設定されている場合はDM送信、そうでなければWebhook送信
  if (instructorSlackMemberId) {
    Logger.log('Sending DM to: ' + instructorSlackMemberId);
    return sendSlackDM(instructorSlackMemberId, messageBlocks);
  } else {
    Logger.log('No slackMemberId, using webhook');
    return sendSlackWebhook(messageBlocks);
  }
}

// キャンセル通知を送信
function sendCancellationNotification(data) {
  const { instructorSlackMemberId, studentName, startTime } = data;
  
  // メッセージブロックを作成
  const messageBlocks = [
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
    },
    {
      type: 'divider'
    }
  ];
  
  // instructorSlackMemberIdが設定されている場合はDM送信、そうでなければWebhook送信
  if (instructorSlackMemberId) {
    Logger.log('Sending DM to: ' + instructorSlackMemberId);
    return sendSlackDM(instructorSlackMemberId, messageBlocks);
  } else {
    Logger.log('No slackMemberId, using webhook');
    return sendSlackWebhook(messageBlocks);
  }
}

// テスト用関数
function testNotification() {
  const testData = {
    type: 'booking',
    instructorSlackMemberId: 'YOUR_SLACK_MEMBER_ID', // ここに自分のSlack Member IDを入力
    studentName: 'テスト生徒',
    startTime: '2024年12月20日 14:00',
    meetingUrl: 'https://meet.google.com/kdd-mtnd-eyc'
  };
  
  sendBookingNotification(testData);
}

