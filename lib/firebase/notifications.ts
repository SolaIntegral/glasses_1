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
  bookingId?: string,
  linkUrl?: string
): Promise<string> => {
  try {
    const notificationData = {
      userId,
      title,
      message,
      type,
      bookingId: bookingId || null,
      linkUrl: linkUrl || null,
      isRead: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log('Creating notification:', { userId, title, type });
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    console.log('Notification created successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// ユーザーの通知一覧取得（Firestore版）
export const getNotificationsByUser = async (userId: string): Promise<Notification[]> => {
  try {
    console.log('Fetching notifications for user:', userId);
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} notifications for user ${userId}`);
    
    const notifications = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        bookingId: data.bookingId,
        linkUrl: data.linkUrl,
        isRead: data.isRead,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Notification;
    });
    
    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    // インデックスエラーの場合は、orderByなしで再試行
    if (error instanceof Error && error.message.includes('index')) {
      console.log('Retrying without orderBy due to index error');
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          bookingId: data.bookingId,
          linkUrl: data.linkUrl,
          isRead: data.isRead,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Notification;
      });
      // クライアント側でソート
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return notifications;
    }
    throw error;
  }
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

// すべての通知を取得（管理画面用）
export const getAllNotifications = async (): Promise<Notification[]> => {
  const q = query(
    collection(db, 'notifications'),
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
      linkUrl: data.linkUrl,
      isRead: data.isRead,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Notification;
  });
};

// システム通知をタイトルでグループ化（管理画面用）
export interface NotificationGroup {
  title: string;
  message: string;
  linkUrl?: string;
  createdAt: Date;
  targetCount: number;
  targetUserIds: string[];
  studentCount?: number;
  totalStudentCount?: number;
  isAllStudents?: boolean;
}

export const getSystemNotificationGroups = async (): Promise<NotificationGroup[]> => {
  const allNotifications = await getAllNotifications();
  
  // システム通知のみをフィルタリング
  const systemNotifications = allNotifications.filter(n => n.type === 'system');
  
  // タイトルとメッセージでグループ化
  const groups = new Map<string, NotificationGroup>();
  
  systemNotifications.forEach(notification => {
    const key = `${notification.title}|${notification.message}|${notification.linkUrl || ''}`;
    
    if (groups.has(key)) {
      const group = groups.get(key)!;
      group.targetCount++;
      if (!group.targetUserIds.includes(notification.userId)) {
        group.targetUserIds.push(notification.userId);
      }
      // より新しい日付を保持
      if (notification.createdAt > group.createdAt) {
        group.createdAt = notification.createdAt;
      }
    } else {
      groups.set(key, {
        title: notification.title,
        message: notification.message,
        linkUrl: notification.linkUrl,
        createdAt: notification.createdAt,
        targetCount: 1,
        targetUserIds: [notification.userId],
      });
    }
  });
  
  return Array.from(groups.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// 予約通知を作成（Firestoreに通知を作成のみ。Slack通知はFirebase Functionsで自動送信）
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
  // 注意: Slack通知はFirebase FunctionsのonCreateBookingトリガーで自動送信されます
  const notificationId = await createNotification(
    instructorId,
    title,
    message,
    'booking',
    bookingId
  );

  return notificationId;
};

// キャンセル通知を作成（Firestoreに通知を作成のみ。Slack通知はFirebase Functionsで自動送信）
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
  // 注意: Slack通知はFirebase FunctionsのonUpdateBookingトリガーで自動送信されます
  const notificationId = await createNotification(
    instructorId,
    title,
    message,
    'cancellation',
    bookingId
  );

  return notificationId;
};
