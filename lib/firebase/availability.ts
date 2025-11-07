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
import { AvailableSlot } from '@/types';

// 空き時間作成（Firestore版）
export const createAvailableSlot = async (
  instructorId: string,
  startTime: Date,
  endTime: Date
): Promise<string> => {
  // 過去の日時でないかチェック
  const now = new Date();
  
  if (startTime < now) {
    throw new Error('過去の日時は設定できません');
  }

  const slotData = {
    instructorId,
    startTime: Timestamp.fromDate(startTime),
    endTime: Timestamp.fromDate(endTime),
    isBooked: false,
    bookingId: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'availableSlots'), slotData);
  return docRef.id;
};

// 空き時間削除（Firestore版）
export const deleteAvailableSlot = async (slotId: string): Promise<void> => {
  const slotDoc = await getDoc(doc(db, 'availableSlots', slotId));
  
  if (!slotDoc.exists()) {
    throw new Error('空き時間が見つかりません');
  }

  const slotData = slotDoc.data();
  if (slotData.isBooked) {
    throw new Error('予約済みの空き時間は削除できません');
  }

  await deleteDoc(doc(db, 'availableSlots', slotId));
};

// 講師の空き時間一覧取得（Firestore版）
export const getAvailableSlotsByInstructor = async (
  instructorId: string
): Promise<AvailableSlot[]> => {
  const q = query(
    collection(db, 'availableSlots'),
    where('instructorId', '==', instructorId),
    orderBy('startTime', 'asc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      instructorId: data.instructorId,
      startTime: data.startTime.toDate(),
      endTime: data.endTime.toDate(),
      isBooked: data.isBooked,
      bookingId: data.bookingId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as AvailableSlot;
  });
};

// 全空き時間一覧取得（Firestore版）
export const getAllAvailableSlots = async (): Promise<AvailableSlot[]> => {
  const q = query(
    collection(db, 'availableSlots'),
    where('isBooked', '==', false),
    orderBy('startTime', 'asc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      instructorId: data.instructorId,
      startTime: data.startTime.toDate(),
      endTime: data.endTime.toDate(),
      isBooked: data.isBooked,
      bookingId: data.bookingId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as AvailableSlot;
  });
};

// 特定日付の空き時間取得（Firestore版）
export const getAvailableSlotsByDate = async (date: Date): Promise<AvailableSlot[]> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, 'availableSlots'),
    where('startTime', '>=', Timestamp.fromDate(startOfDay)),
    where('startTime', '<=', Timestamp.fromDate(endOfDay)),
    where('isBooked', '==', false),
    orderBy('startTime', 'asc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      instructorId: data.instructorId,
      startTime: data.startTime.toDate(),
      endTime: data.endTime.toDate(),
      isBooked: data.isBooked,
      bookingId: data.bookingId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as AvailableSlot;
  });
};

// 空き時間更新（Firestore版）
export const updateAvailableSlot = async (
  slotId: string,
  updates: Partial<AvailableSlot>
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

  await updateDoc(doc(db, 'availableSlots', slotId), updateData);
};