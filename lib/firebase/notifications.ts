import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { Notification } from '@/types';

// 通知作成（Firestore版）
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'booking' | 'cancellation' | 'reminder' | 'system',
  bookingId?: string
): Promise<string> => {
  const notificationData = {
    userId,
    title,
    message,
    type,
    bookingId: bookingId || null,
    isRead: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'notifications'), notificationData);
  return docRef.id;
};

// ユーザーの通知一覧取得（Firestore版）
export const getNotificationsByUser = async (userId: string): Promise<Notification[]> => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      bookingId: data.bookingId,
      isRead: data.isRead,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Notification;
  });
};

// 通知を既読にする（Firestore版）
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await updateDoc(doc(db, 'notifications', notificationId), {
    isRead: true,
    updatedAt: Timestamp.now(),
  });
};

// 未読通知数取得（Firestore版）
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
};

// 通知削除（Firestore版）
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await deleteDoc(doc(db, 'notifications', notificationId));
};

// 全通知削除（Firestore版）
export const deleteAllNotifications = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );
  
  const querySnapshot = await getDocs(q);
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

// GAS経由でSlack通知を送信する関数
const sendSlackNotificationViaGAS = async (data: {
  type: 'booking' | 'cancellation';
  instructorId: string;
  instructorSlackMemberId?: string;
  studentName: string;
  startTime: string;
  meetingUrl?: string;
}) => {
  try {
    // GAS Webhook URL（環境変数または固定値）
    const GAS_WEBHOOK_URL = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL || 
      'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

    const response = await fetch(GAS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    return await response.json();
  } catch (error) {
    console.error('Failed to send Slack notification via GAS:', error);
    return { success: false, error };
  }
};

// 予約通知を作成し、Slack通知も送信
export const createBookingNotificationWithSlack = async (
  instructorId: string,
  instructorSlackMemberId: string | undefined,
  title: string,
  message: string,
  bookingId: string,
  startTime: Date,
  studentName: string,
  meetingUrl?: string
): Promise<string> => {
  // Firestoreに通知を作成
  const notificationId = await createNotification(
    instructorId,
    title,
    message,
    'booking',
    bookingId
  );

  // Slack通知も送信（slackMemberIdが設定されている場合）
  if (instructorSlackMemberId) {
    await sendSlackNotificationViaGAS({
      type: 'booking',
      instructorId,
      instructorSlackMemberId,
      studentName,
      startTime: startTime.toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      meetingUrl
    });
  }

  return notificationId;
};

// キャンセル通知を作成し、Slack通知も送信
export const createCancellationNotificationWithSlack = async (
  instructorId: string,
  instructorSlackMemberId: string | undefined,
  title: string,
  message: string,
  bookingId: string,
  startTime: Date,
  studentName: string
): Promise<string> => {
  // Firestoreに通知を作成
  const notificationId = await createNotification(
    instructorId,
    title,
    message,
    'cancellation',
    bookingId
  );

  // Slack通知も送信（slackMemberIdが設定されている場合）
  if (instructorSlackMemberId) {
    await sendSlackNotificationViaGAS({
      type: 'cancellation',
      instructorId,
      instructorSlackMemberId,
      studentName,
      startTime: startTime.toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });
  }

  return notificationId;
};
