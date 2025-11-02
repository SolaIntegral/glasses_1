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
import { Booking, AvailableSlot, SessionType } from '@/types';

// 予約作成（24時間チェック付き・Firestore版）
export const createBooking = async (
  instructorId: string,
  studentId: string,
  slotId: string,
  startTime: Date,
  endTime: Date,
  purpose: string,
  notes?: string,
  sessionType?: SessionType,
  questionsBeforeSession?: string[]
): Promise<string> => {
  // 24時間以上先かチェック
  const now = new Date();
  const hoursDiff = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursDiff < 24) {
    throw new Error('予約は24時間以上前に行う必要があります');
  }

  // 空き時間が存在し、予約されていないかチェック
  const slotDoc = await getDoc(doc(db, 'availableSlots', slotId));
  if (!slotDoc.exists()) {
    throw new Error('空き時間が見つかりません');
  }
  
  const slotData = slotDoc.data();
  if (slotData.isBooked) {
    throw new Error('この時間は既に予約されています');
  }

  // 予約を作成
  const bookingData: any = {
    instructorId,
    studentId,
    slotId,
    startTime: Timestamp.fromDate(startTime),
    endTime: Timestamp.fromDate(endTime),
    purpose,
    notes: notes || '',
    status: 'confirmed',
    meetingUrl: 'https://meet.google.com/kdd-mtnd-eyc', // 共通の会議リンク
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // MVP要件で追加: セッションタイプと質問を追加
  if (sessionType) {
    bookingData.sessionType = sessionType;
  }
  if (questionsBeforeSession && questionsBeforeSession.length > 0) {
    bookingData.questionsBeforeSession = questionsBeforeSession;
  }

  const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);

  // 空き時間を予約済みに更新
  await updateDoc(doc(db, 'availableSlots', slotId), {
    isBooked: true,
    bookingId: bookingRef.id,
    updatedAt: Timestamp.now(),
  });

  // 講師に通知を作成（Firestore + Slack通知）
  try {
    const { createBookingNotificationWithSlack } = await import('./notifications');
    // 講師情報を取得（slackMemberIdを含む）
    const instructorDoc = await getDoc(doc(db, 'instructors', instructorId));
    const instructorData = instructorDoc.exists() ? instructorDoc.data() : null;
    const instructorSlackMemberId = instructorData?.slackMemberId;

    // 生徒情報を取得
    const studentDoc = await getDoc(doc(db, 'users', studentId));
    const studentData = studentDoc.exists() ? studentDoc.data() : null;
    const studentName = studentData?.displayName || '生徒';

    await createBookingNotificationWithSlack(
      instructorId,
      instructorSlackMemberId,
      '📅 新しい予約があります',
      `${startTime.toLocaleString('ja-JP', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      })}に予約が入りました。生徒名: ${studentName}`,
      bookingRef.id,
      startTime,
      studentName,
      'https://meet.google.com/kdd-mtnd-eyc'
    );
  } catch (error) {
    console.error('Failed to create notification:', error);
    // 通知作成失敗は非致命的なので、予約は成功させる
  }

  return bookingRef.id;
};

// 予約キャンセル（Firestore版）
export const cancelBooking = async (bookingId: string): Promise<void> => {
  const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
  
  if (!bookingDoc.exists()) {
    throw new Error('予約が見つかりません');
  }

  const bookingData = bookingDoc.data();
  
  // 予約をキャンセル済みに更新
  await updateDoc(doc(db, 'bookings', bookingId), {
    status: 'cancelled',
    updatedAt: Timestamp.now(),
  });

  // 空き時間を利用可能に戻す
  await updateDoc(doc(db, 'availableSlots', bookingData.slotId), {
    isBooked: false,
    bookingId: null,
    updatedAt: Timestamp.now(),
  });

  // 講師にキャンセル通知を作成（Firestore + Slack通知）
  try {
    const { createCancellationNotificationWithSlack } = await import('./notifications');
    // キャンセル前に予約情報を取得
    const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
    if (bookingDoc.exists()) {
      const bookingData = bookingDoc.data();
      const startTime = bookingData.startTime.toDate();

      // 講師情報を取得
      const instructorDoc = await getDoc(doc(db, 'instructors', bookingData.instructorId));
      const instructorData = instructorDoc.exists() ? instructorDoc.data() : null;
      const instructorSlackMemberId = instructorData?.slackMemberId;

      // 生徒情報を取得
      const studentDoc = await getDoc(doc(db, 'users', bookingData.studentId));
      const studentData = studentDoc.exists() ? studentDoc.data() : null;
      const studentName = studentData?.displayName || '生徒';

      await createCancellationNotificationWithSlack(
        bookingData.instructorId,
        instructorSlackMemberId,
        '❌ 予約がキャンセルされました',
        `${startTime.toLocaleString('ja-JP', { 
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        })}の予約がキャンセルされました`,
        bookingId,
        startTime,
        studentName
      );
    }
  } catch (error) {
    console.error('Failed to create cancellation notification:', error);
    // 通知作成失敗は非致命的なので、キャンセルは成功させる
  }
};

// 生徒の予約一覧取得（Firestore版）
export const getBookingsByStudent = async (studentId: string): Promise<Booking[]> => {
  const q = query(
    collection(db, 'bookings'),
    where('studentId', '==', studentId),
    orderBy('startTime', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startTime: doc.data().startTime.toDate(),
    endTime: doc.data().endTime.toDate(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  })) as Booking[];
};

// 講師の予約一覧取得（Firestore版）
export const getBookingsByInstructor = async (instructorId: string): Promise<Booking[]> => {
  const q = query(
    collection(db, 'bookings'),
    where('instructorId', '==', instructorId),
    orderBy('startTime', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startTime: doc.data().startTime.toDate(),
    endTime: doc.data().endTime.toDate(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  })) as Booking[];
};

// 予約詳細取得（Firestore版）
export const getBooking = async (bookingId: string): Promise<Booking | null> => {
  const docRef = doc(db, 'bookings', bookingId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      startTime: data.startTime.toDate(),
      endTime: data.endTime.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Booking;
  }
  
  return null;
};

// 予約詳細取得（エイリアス）
export const getBookingById = getBooking;

// 全予約取得（管理者用）
export const getAllBookings = async (): Promise<Booking[]> => {
  const q = query(
    collection(db, 'bookings'),
    orderBy('startTime', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startTime: doc.data().startTime.toDate(),
    endTime: doc.data().endTime.toDate(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  })) as Booking[];
};

// 予約強制キャンセル（管理者用 - 24時間制限なし）
export const forceCancelBooking = async (bookingId: string): Promise<void> => {
  const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
  
  if (!bookingDoc.exists()) {
    throw new Error('予約が見つかりません');
  }

  const bookingData = bookingDoc.data();
  
  // 予約をキャンセル済みに更新
  await updateDoc(doc(db, 'bookings', bookingId), {
    status: 'cancelled',
    updatedAt: Timestamp.now(),
  });

  // 空き時間を利用可能に戻す
  await updateDoc(doc(db, 'availableSlots', bookingData.slotId), {
    isBooked: false,
    bookingId: null,
    updatedAt: Timestamp.now(),
  });

  // 講師にキャンセル通知を作成（Firestore + Slack通知）
  try {
    const { createCancellationNotificationWithSlack } = await import('./notifications');
    const startTime = bookingData.startTime.toDate();
    
    // 講師情報を取得
    const instructorDoc = await getDoc(doc(db, 'instructors', bookingData.instructorId));
    const instructorData = instructorDoc.exists() ? instructorDoc.data() : null;
    const instructorSlackMemberId = instructorData?.slackMemberId;
    
    // 生徒情報を取得
    const studentDoc = await getDoc(doc(db, 'users', bookingData.studentId));
    const studentData = studentDoc.exists() ? studentDoc.data() : null;
    const studentName = studentData?.displayName || '生徒';

    await createCancellationNotificationWithSlack(
      bookingData.instructorId,
      instructorSlackMemberId,
      '❌ 予約がキャンセルされました（管理者操作）',
      `${startTime.toLocaleString('ja-JP', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      })}の予約が管理者の操作によりキャンセルされました`,
      bookingId,
      startTime,
      studentName
    );
  } catch (error) {
    console.error('Failed to create cancellation notification:', error);
    // 通知作成失敗は非致命的なので、キャンセルは成功させる
  }
};

// 予約更新（Firestore版）
export const updateBooking = async (
  bookingId: string,
  updates: Partial<Booking>
): Promise<void> => {
  const updateData = {
    ...updates,
    updatedAt: Timestamp.now(),
  };

  // Timestamp変換
  if (updateData.startTime && updateData.startTime instanceof Date) {
    (updateData as any).startTime = Timestamp.fromDate(updateData.startTime);
  }
  if (updateData.endTime && updateData.endTime instanceof Date) {
    (updateData as any).endTime = Timestamp.fromDate(updateData.endTime);
  }

  await updateDoc(doc(db, 'bookings', bookingId), updateData);
};