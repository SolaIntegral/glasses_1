import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { WebClient } from '@slack/web-api';
import { google } from 'googleapis';

admin.initializeApp();

// Slack Bot Token（環境変数から取得）
const slackToken = functions.config().slack?.bot_token || process.env.SLACK_BOT_TOKEN;
const slackClient = slackToken ? new WebClient(slackToken) : null;

// パスワードをハッシュ化する関数（簡易版）
function hashPassword(password: string): string {
  // 本番環境ではbcrypt等のライブラリを使用すること
  return Buffer.from(password).toString('base64');
}

// カスタムTokenを生成してログイン
export const signInWithCustomToken = functions.https.onCall(async (data, context) => {
  const { userId, password } = data;

  if (!userId || !password) {
    throw new functions.https.HttpsError('invalid-argument', 'userIdとpasswordが必要です');
  }

  try {
    // Firestoreからユーザー情報を取得
    const userDoc = await admin.firestore().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'ユーザーが見つかりません');
    }

    const userData = userDoc.data();

    // パスワード検証
    const hashedPassword = hashPassword(password);
    if (userData?.hashedPassword !== hashedPassword) {
      throw new functions.https.HttpsError('permission-denied', 'パスワードが正しくありません');
    }

    // カスタムTokenを生成
    const customToken = await admin.auth().createCustomToken(userId);

    return { customToken };
  } catch (error: any) {
    console.error('Error in signInWithCustomToken:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 予約通知をSlack DMで送信
export const sendBookingNotification = functions.https.onCall(async (data, context) => {
  const { bookingId } = data;

  if (!bookingId) {
    throw new functions.https.HttpsError('invalid-argument', 'bookingIdが必要です');
  }

  if (!slackClient) {
    console.warn('Slack client is not configured');
    return { success: false, message: 'Slack is not configured' };
  }

  try {
    // 予約情報を取得
    const bookingDoc = await admin.firestore().collection('bookings').doc(bookingId).get();
    
    if (!bookingDoc.exists) {
      throw new functions.https.HttpsError('not-found', '予約が見つかりません');
    }

    const booking = bookingDoc.data();
    if (!booking) {
      throw new functions.https.HttpsError('not-found', '予約データが取得できません');
    }

    // 講師情報を取得
    const instructorDoc = await admin.firestore().collection('instructors').doc(booking.instructorId).get();
    const instructor = instructorDoc.exists ? instructorDoc.data() : null;

    // 生徒情報を取得
    const studentDoc = await admin.firestore().collection('users').doc(booking.studentId).get();
    const student = studentDoc.exists ? studentDoc.data() : null;

    // Slack Member IDが設定されているか確認
    if (!instructor?.slackMemberId) {
      console.warn(`Slack member ID not found for instructor ${booking.instructorId}`);
      return { success: false, message: '講師のSlack Member IDが設定されていません' };
    }

    // 日時をフォーマット
    const startTime = booking.startTime?.toDate();
    const formattedDate = startTime ? 
      `${startTime.getFullYear()}年${startTime.getMonth() + 1}月${startTime.getDate()}日` : '';
    const formattedTime = startTime ? 
      `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}` : '';

    // DMを送信
    const message = await slackClient.conversations.open({
      users: instructor.slackMemberId,
    });

    if (!message.ok || !message.channel?.id) {
      throw new Error('Failed to open DM channel');
    }

    await slackClient.chat.postMessage({
      channel: message.channel.id,
      text: '📅 新しい予約があります',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📅 新しい予約があります',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*生徒名:*\n${student?.displayName || '不明'}`,
            },
            {
              type: 'mrkdwn',
              text: `*日時:*\n${formattedDate} ${formattedTime}〜`,
            },
            {
              type: 'mrkdwn',
              text: `*目的:*\n${booking.purpose || '-'}`,
            },
            {
              type: 'mrkdwn',
              text: `*メモ:*\n${booking.notes || '-'}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<${booking.meetingUrl || ''}|Google Meet に参加>`,
          },
        },
      ],
    });

    return { success: true, message: '通知を送信しました' };
  } catch (error: any) {
    console.error('Error sending Slack notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// レポート催促メッセージをSlack DMで送信
export const sendReportReminder = functions.https.onCall(async (data, context) => {
  const { instructorId } = data;

  if (!instructorId) {
    throw new functions.https.HttpsError('invalid-argument', 'instructorIdが必要です');
  }

  if (!slackClient) {
    console.warn('Slack client is not configured');
    return { success: false, message: 'Slack is not configured' };
  }

  try {
    // 講師情報を取得
    const instructorDoc = await admin.firestore().collection('instructors').doc(instructorId).get();
    const instructor = instructorDoc.exists ? instructorDoc.data() : null;

    if (!instructor) {
      throw new functions.https.HttpsError('not-found', '講師が見つかりません');
    }

    // Slack Member IDが設定されているか確認
    if (!instructor.slackMemberId) {
      console.warn(`Slack member ID not found for instructor ${instructorId}`);
      return { success: false, message: '講師のSlack Member IDが設定されていません' };
    }

    // DMを開く
    const message = await slackClient.conversations.open({
      users: instructor.slackMemberId,
    });

    if (!message.ok || !message.channel?.id) {
      throw new Error('Failed to open DM channel');
    }

    // レポート催促メッセージを送信
    await slackClient.chat.postMessage({
      channel: message.channel.id,
      text: '📝 セッション後レポートの入力をお願いします',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📝 セッション後レポートの入力をお願いします',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'セッションお疲れ様でした！\n以下のフォームから、セッション後のレポートを入力してください。',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '<https://forms.gle/jhn2674CETV3L3qN8|セッション後レポートを入力>',
          },
        },
      ],
    });

    return { success: true, message: 'リマインダーを送信しました' };
  } catch (error: any) {
    console.error('Error sending report reminder:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// 予約キャンセル通知をSlack DMで送信
export const sendBookingCancellationNotification = functions.https.onCall(async (data, context) => {
  const { bookingId } = data;

  if (!bookingId) {
    throw new functions.https.HttpsError('invalid-argument', 'bookingIdが必要です');
  }

  if (!slackClient) {
    console.warn('Slack client is not configured');
    return { success: false, message: 'Slack is not configured' };
  }

  try {
    const bookingDoc = await admin.firestore().collection('bookings').doc(bookingId).get();
    if (!bookingDoc.exists) {
      throw new functions.https.HttpsError('not-found', '予約が見つかりません');
    }

    const booking = bookingDoc.data();
    if (!booking) {
      return { success: false, message: '予約データが取得できません' };
    }

    const instructorDoc = await admin.firestore().collection('instructors').doc(booking.instructorId).get();
    const instructor = instructorDoc.exists ? instructorDoc.data() : null;
    const studentDoc = await admin.firestore().collection('users').doc(booking.studentId).get();
    const student = studentDoc.exists ? studentDoc.data() : null;

    if (!instructor?.slackMemberId) {
      console.warn(`Slack member ID not found for instructor ${booking.instructorId}`);
      return { success: false, message: '講師のSlack Member IDが設定されていません' };
    }

    const startTime = booking.startTime?.toDate();
    const formattedDate = startTime ? 
      `${startTime.getFullYear()}年${startTime.getMonth() + 1}月${startTime.getDate()}日` : '';
    const formattedTime = startTime ? 
      `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}` : '';

    const message = await slackClient.conversations.open({
      users: instructor.slackMemberId,
    });

    if (!message.ok || !message.channel?.id) {
      throw new Error('Failed to open DM channel');
    }

    await slackClient.chat.postMessage({
      channel: message.channel.id,
      text: '❌ 予約がキャンセルされました',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '❌ 予約がキャンセルされました',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*生徒名:*\n${student?.displayName || '不明'}`,
            },
            {
              type: 'mrkdwn',
              text: `*日時:*\n${formattedDate} ${formattedTime}〜`,
            },
          ],
        },
      ],
    });

    return { success: true, message: '通知を送信しました' };
  } catch (error: any) {
    console.error('Error sending cancellation notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ユーザー登録時にカスタムTokenを生成
export const signUpWithCustomToken = functions.https.onCall(async (data, context) => {
  const { userId, password, displayName, role } = data;

  if (!userId || !password || !displayName || !role) {
    throw new functions.https.HttpsError('invalid-argument', '必要な情報が不足しています');
  }

  try {
    // 重複チェック
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (userDoc.exists) {
      throw new functions.https.HttpsError('already-exists', 'このユーザーIDは既に使用されています');
    }

    // パスワードをハッシュ化
    const hashedPassword = hashPassword(password);

    // Firestoreにユーザー情報を保存
    await admin.firestore().collection('users').doc(userId).set({
      displayName,
      role,
      hashedPassword,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 講師の場合は講師情報も作成
    if (role === 'instructor') {
      await admin.firestore().collection('instructors').doc(userId).set({
        userId,
        bio: '',
        specialties: [],
        profileImageUrl: '',
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // カスタムTokenを生成
    const customToken = await admin.auth().createCustomToken(userId);

    return { customToken };
  } catch (error: any) {
    console.error('Error in signUpWithCustomToken:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// セッション前リマインド（セッション開始の24時間前）
export const sendSessionReminder = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  if (!slackClient) {
    console.warn('Slack client is not configured');
    return null;
  }

  const now = new Date();
  const targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24時間後

  try {
    const bookingsSnapshot = await admin.firestore()
      .collection('bookings')
      .where('status', '==', 'confirmed')
      .get();

    for (const bookingDoc of bookingsSnapshot.docs) {
      const booking = bookingDoc.data();
      const startTime = booking.startTime.toDate();

      // 開始時刻が24時間以内の場合、リマインドを送信
      if (startTime.getTime() <= targetTime.getTime() && startTime.getTime() > now.getTime()) {
        // 既に送信済みかチェック
        if (booking.reminderSent) continue;

        try {
          const instructorDoc = await admin.firestore()
            .collection('instructors')
            .doc(booking.instructorId)
            .get();
          const instructor = instructorDoc.data();

          if (instructor?.slackMemberId) {
            const studentDoc = await admin.firestore()
              .collection('users')
              .doc(booking.studentId)
              .get();
            const student = studentDoc.data();

            const message = await slackClient.conversations.open({
              users: instructor.slackMemberId,
            });

            if (message.ok && message.channel?.id) {
              await slackClient.chat.postMessage({
                channel: message.channel.id,
                text: '⏰ セッションリマインド',
                blocks: [
                  {
                    type: 'header',
                    text: {
                      type: 'plain_text',
                      text: '⏰ セッションリマインド',
                      emoji: true,
                    },
                  },
                  {
                    type: 'section',
                    text: {
                      type: 'mrkdwn',
                      text: `明日${startTime.getHours()}時${String(startTime.getMinutes()).padStart(2, '0')}分から予約があります`,
                    },
                  },
                  {
                    type: 'section',
                    fields: [
                      {
                        type: 'mrkdwn',
                        text: `*生徒名:*\n${student?.displayName || '不明'}`,
                      },
                      {
                        type: 'mrkdwn',
                        text: `*日時:*\n${startTime.toLocaleString('ja-JP')}`,
                      },
                    ],
                  },
                  {
                    type: 'section',
                    text: {
                      type: 'mrkdwn',
                      text: `<${booking.meetingUrl || ''}|Google Meet に参加>`,
                    },
                  },
                ],
              });

              // リマインダー送信済みフラグを設定
              await bookingDoc.ref.update({ reminderSent: true });
            }
          }
        } catch (error) {
          console.error('Error sending session reminder:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error in sendSessionReminder:', error);
  }

  return null;
});

// セッション後リマインド（セッション終了後）
export const sendPostSessionReminder = functions.pubsub.schedule('every 30 minutes').onRun(async (context) => {
  if (!slackClient) {
    console.warn('Slack client is not configured');
    return null;
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    const bookingsSnapshot = await admin.firestore()
      .collection('bookings')
      .where('status', '==', 'confirmed')
      .get();

    for (const bookingDoc of bookingsSnapshot.docs) {
      const booking = bookingDoc.data();
      const endTime = booking.endTime.toDate();

      // 終了時刻が1時間以内の場合、レポート催促を送信
      if (endTime.getTime() <= now.getTime() && endTime.getTime() > oneHourAgo.getTime()) {
        // 既に送信済みかチェック
        if (booking.postSessionReminderSent) continue;

        try {
          const instructorDoc = await admin.firestore()
            .collection('instructors')
            .doc(booking.instructorId)
            .get();
          const instructor = instructorDoc.data();

          if (instructor?.slackMemberId) {
            const message = await slackClient.conversations.open({
              users: instructor.slackMemberId,
            });

            if (message.ok && message.channel?.id) {
              await slackClient.chat.postMessage({
                channel: message.channel.id,
                text: '📝 セッション後レポートの入力をお願いします',
                blocks: [
                  {
                    type: 'header',
                    text: {
                      type: 'plain_text',
                      text: '📝 セッション後レポートの入力をお願いします',
                      emoji: true,
                    },
                  },
                  {
                    type: 'section',
                    text: {
                      type: 'mrkdwn',
                      text: 'セッションお疲れ様でした！\n以下のフォームから、セッション後のレポートを入力してください。',
                    },
                  },
                  {
                    type: 'section',
                    text: {
                      type: 'mrkdwn',
                      text: '<https://forms.gle/jhn2674CETV3L3qN8|セッション後レポートを入力>',
                    },
                  },
                ],
              });

              // リマインダー送信済みフラグを設定
              await bookingDoc.ref.update({ postSessionReminderSent: true });
            }
          }
        } catch (error) {
          console.error('Error sending post-session reminder:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error in sendPostSessionReminder:', error);
  }

  return null;
});

// Google Calendar APIの設定
const getCalendarClient = () => {
  // サービスアカウントの認証情報を環境変数から取得
  // または Firebase Functions の設定から取得
  const serviceAccountKey = functions.config().google?.service_account_key;
  
  if (!serviceAccountKey) {
    console.warn('Google Calendar API credentials not configured');
    return null;
  }

  try {
    // サービスアカウントキーはすでにオブジェクトとして保存されている
    // 文字列の場合はパース、オブジェクトの場合はそのまま使用
    const credentials = typeof serviceAccountKey === 'string' 
      ? JSON.parse(serviceAccountKey) 
      : serviceAccountKey;
    
    // サービスアカウント認証
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    return calendar;
  } catch (error) {
    console.error('Error initializing Google Calendar client:', error);
    console.error('Service account key type:', typeof serviceAccountKey);
    return null;
  }
};

// 共通カレンダーIDを取得（環境変数またはFirebase Functions設定から）
const getSharedCalendarId = (): string | null => {
  // Firebase Functions の設定から取得
  const calendarId = functions.config().google?.calendar_id || process.env.GOOGLE_CALENDAR_ID;
  return calendarId || null;
};

// 予約作成時にGoogleカレンダーにイベントを追加
export const onCreateBooking = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    const bookingId = context.params.bookingId;

    // 予約が確定済みの場合のみ処理
    if (booking.status !== 'confirmed') {
      return null;
    }

    try {
      // 共通カレンダーIDを取得
      const calendarId = getSharedCalendarId();
      if (!calendarId) {
        console.warn('Shared calendar ID not configured');
        return null;
      }

      // 講師情報を取得
      const instructorDoc = await admin.firestore()
        .collection('instructors')
        .doc(booking.instructorId)
        .get();
      
      if (!instructorDoc.exists) {
        console.warn(`Instructor not found: ${booking.instructorId}`);
        return null;
      }

      const instructor = instructorDoc.data();
      
      // 講師の情報を取得
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(booking.instructorId)
        .get();
      
      const userData = userDoc.exists ? userDoc.data() : null;
      const instructorName = userData?.displayName || '講師';
      const instructorEmail = userData?.email || instructor?.email;
      const instructorMeetingUrl = instructor?.meetingUrl || booking.meetingUrl;

      // 生徒情報を取得
      const studentDoc = await admin.firestore()
        .collection('users')
        .doc(booking.studentId)
        .get();
      
      const student = studentDoc.exists ? studentDoc.data() : null;
      const studentName = student?.displayName || '生徒';

      // Google Calendar APIクライアントを取得
      const calendar = getCalendarClient();
      if (!calendar) {
        console.warn('Google Calendar client not available');
        return null;
      }

      // 日時をフォーマット
      const startTime = booking.startTime.toDate();
      const endTime = booking.endTime.toDate();

      // イベントの説明文を作成
      const description = [
        `講師名: ${instructorName}`,
        `生徒名: ${studentName}`,
        `目的: ${booking.purpose || '面談'}`,
        booking.notes ? `メモ: ${booking.notes}` : '',
        booking.sessionType === 'one-time' ? 'セッションタイプ: 単発' : 'セッションタイプ: 定例',
        booking.questionsBeforeSession && booking.questionsBeforeSession.length > 0
          ? `事前質問:\n${booking.questionsBeforeSession.join('\n')}`
          : '',
        instructorMeetingUrl ? `\nミーティングリンク: ${instructorMeetingUrl}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      // Googleカレンダーにイベントを作成
      const event = {
        summary: `【メンターセッション】${instructorName} × ${studentName} の面談`,
        description: description,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Asia/Tokyo',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Asia/Tokyo',
        },
        attendees: [
          ...(instructorEmail ? [{ email: instructorEmail }] : []),
          ...(student?.email ? [{ email: student.email }] : []),
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24時間前
            { method: 'popup', minutes: 15 }, // 15分前
          ],
        },
        ...(instructorMeetingUrl ? {
          hangoutLink: instructorMeetingUrl,
          conferenceData: {
            createRequest: {
              requestId: `booking-${bookingId}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        } : {}),
      };

      const response = await calendar.events.insert({
        calendarId: calendarId,
        requestBody: event,
        sendUpdates: 'all', // 参加者にメール通知を送信
      });

      // イベントIDを予約データに保存
      await snap.ref.update({
        googleCalendarEventId: response.data.id,
        googleCalendarLink: response.data.htmlLink,
      });

      console.log(`Google Calendar event created: ${response.data.id}`);
      
      // Slack通知は一旦無効化（カレンダー連携の確認を優先）
      // TODO: カレンダー連携が確認できたら、Slack通知を再有効化
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating Google Calendar event:', error);
      // エラーが発生しても予約作成は続行する
      return null;
    }
  });

// 予約キャンセル時にGoogleカレンダーのイベントを削除
export const onUpdateBooking = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const bookingId = context.params.bookingId;

    // 予約がキャンセルされた場合
    if (before.status === 'confirmed' && after.status === 'cancelled') {
      const googleCalendarEventId = before.googleCalendarEventId;

      if (!googleCalendarEventId) {
        console.log('No Google Calendar event ID found for booking:', bookingId);
        return null;
      }

      try {
        // 共通カレンダーIDを取得
        const calendarId = getSharedCalendarId();
        if (!calendarId) {
          console.warn('Shared calendar ID not configured');
          return null;
        }

        const calendar = getCalendarClient();
        if (!calendar) {
          console.warn('Google Calendar client not available');
          return null;
        }

        // イベントを削除
        await calendar.events.delete({
          calendarId: calendarId,
          eventId: googleCalendarEventId,
          sendUpdates: 'all', // 参加者にキャンセル通知を送信
        });

        console.log(`Google Calendar event deleted: ${googleCalendarEventId}`);
      } catch (error: any) {
        console.error('Error deleting Google Calendar event:', error);
        // エラーが発生しても処理は続行
      }
      
      // Slack通知は一旦無効化（カレンダー連携の確認を優先）
      // TODO: カレンダー連携が確認できたら、Slack通知を再有効化
    }

    return null;
  });
