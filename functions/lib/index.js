"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPostSessionReminder = exports.sendSessionReminder = exports.signUpWithCustomToken = exports.sendBookingCancellationNotification = exports.sendReportReminder = exports.sendBookingNotification = exports.signInWithCustomToken = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const web_api_1 = require("@slack/web-api");
admin.initializeApp();
// Slack Bot Token（環境変数から取得）
const slackToken = ((_a = functions.config().slack) === null || _a === void 0 ? void 0 : _a.bot_token) || process.env.SLACK_BOT_TOKEN;
const slackClient = slackToken ? new web_api_1.WebClient(slackToken) : null;
// パスワードをハッシュ化する関数（簡易版）
function hashPassword(password) {
    // 本番環境ではbcrypt等のライブラリを使用すること
    return Buffer.from(password).toString('base64');
}
// カスタムTokenを生成してログイン
exports.signInWithCustomToken = functions.https.onCall(async (data, context) => {
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
        if ((userData === null || userData === void 0 ? void 0 : userData.hashedPassword) !== hashedPassword) {
            throw new functions.https.HttpsError('permission-denied', 'パスワードが正しくありません');
        }
        // カスタムTokenを生成
        const customToken = await admin.auth().createCustomToken(userId);
        return { customToken };
    }
    catch (error) {
        console.error('Error in signInWithCustomToken:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// 予約通知をSlack DMで送信
exports.sendBookingNotification = functions.https.onCall(async (data, context) => {
    var _a, _b;
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
        if (!(instructor === null || instructor === void 0 ? void 0 : instructor.slackMemberId)) {
            console.warn(`Slack member ID not found for instructor ${booking.instructorId}`);
            return { success: false, message: '講師のSlack Member IDが設定されていません' };
        }
        // 日時をフォーマット
        const startTime = (_a = booking.startTime) === null || _a === void 0 ? void 0 : _a.toDate();
        const formattedDate = startTime ?
            `${startTime.getFullYear()}年${startTime.getMonth() + 1}月${startTime.getDate()}日` : '';
        const formattedTime = startTime ?
            `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}` : '';
        // DMを送信
        const message = await slackClient.conversations.open({
            users: instructor.slackMemberId,
        });
        if (!message.ok || !((_b = message.channel) === null || _b === void 0 ? void 0 : _b.id)) {
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
                            text: `*生徒名:*\n${(student === null || student === void 0 ? void 0 : student.displayName) || '不明'}`,
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
    }
    catch (error) {
        console.error('Error sending Slack notification:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// レポート催促メッセージをSlack DMで送信
exports.sendReportReminder = functions.https.onCall(async (data, context) => {
    var _a;
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
        if (!message.ok || !((_a = message.channel) === null || _a === void 0 ? void 0 : _a.id)) {
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
    }
    catch (error) {
        console.error('Error sending report reminder:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// 予約キャンセル通知をSlack DMで送信
exports.sendBookingCancellationNotification = functions.https.onCall(async (data, context) => {
    var _a, _b;
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
        if (!(instructor === null || instructor === void 0 ? void 0 : instructor.slackMemberId)) {
            console.warn(`Slack member ID not found for instructor ${booking.instructorId}`);
            return { success: false, message: '講師のSlack Member IDが設定されていません' };
        }
        const startTime = (_a = booking.startTime) === null || _a === void 0 ? void 0 : _a.toDate();
        const formattedDate = startTime ?
            `${startTime.getFullYear()}年${startTime.getMonth() + 1}月${startTime.getDate()}日` : '';
        const formattedTime = startTime ?
            `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}` : '';
        const message = await slackClient.conversations.open({
            users: instructor.slackMemberId,
        });
        if (!message.ok || !((_b = message.channel) === null || _b === void 0 ? void 0 : _b.id)) {
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
                            text: `*生徒名:*\n${(student === null || student === void 0 ? void 0 : student.displayName) || '不明'}`,
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
    }
    catch (error) {
        console.error('Error sending cancellation notification:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// ユーザー登録時にカスタムTokenを生成
exports.signUpWithCustomToken = functions.https.onCall(async (data, context) => {
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
    }
    catch (error) {
        console.error('Error in signUpWithCustomToken:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// セッション前リマインド（セッション開始の24時間前）
exports.sendSessionReminder = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    var _a;
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
                if (booking.reminderSent)
                    continue;
                try {
                    const instructorDoc = await admin.firestore()
                        .collection('instructors')
                        .doc(booking.instructorId)
                        .get();
                    const instructor = instructorDoc.data();
                    if (instructor === null || instructor === void 0 ? void 0 : instructor.slackMemberId) {
                        const studentDoc = await admin.firestore()
                            .collection('users')
                            .doc(booking.studentId)
                            .get();
                        const student = studentDoc.data();
                        const message = await slackClient.conversations.open({
                            users: instructor.slackMemberId,
                        });
                        if (message.ok && ((_a = message.channel) === null || _a === void 0 ? void 0 : _a.id)) {
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
                                                text: `*生徒名:*\n${(student === null || student === void 0 ? void 0 : student.displayName) || '不明'}`,
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
                }
                catch (error) {
                    console.error('Error sending session reminder:', error);
                }
            }
        }
    }
    catch (error) {
        console.error('Error in sendSessionReminder:', error);
    }
    return null;
});
// セッション後リマインド（セッション終了後）
exports.sendPostSessionReminder = functions.pubsub.schedule('every 30 minutes').onRun(async (context) => {
    var _a;
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
                if (booking.postSessionReminderSent)
                    continue;
                try {
                    const instructorDoc = await admin.firestore()
                        .collection('instructors')
                        .doc(booking.instructorId)
                        .get();
                    const instructor = instructorDoc.data();
                    if (instructor === null || instructor === void 0 ? void 0 : instructor.slackMemberId) {
                        const message = await slackClient.conversations.open({
                            users: instructor.slackMemberId,
                        });
                        if (message.ok && ((_a = message.channel) === null || _a === void 0 ? void 0 : _a.id)) {
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
                }
                catch (error) {
                    console.error('Error sending post-session reminder:', error);
                }
            }
        }
    }
    catch (error) {
        console.error('Error in sendPostSessionReminder:', error);
    }
    return null;
});
//# sourceMappingURL=index.js.map