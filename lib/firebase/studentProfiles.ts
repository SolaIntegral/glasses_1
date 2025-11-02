import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { StudentProfile, ConversationHistory } from '@/types';

/**
 * 生徒プロフィールを取得
 */
export const getStudentProfile = async (userId: string): Promise<StudentProfile | null> => {
  try {
    const docRef = doc(db, 'studentProfiles', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        interests: data.interests || [],
        previousConversations: data.previousConversations?.map((conv: any) => ({
          ...conv,
          date: conv.date?.toDate() || new Date(),
        })) || [],
        notes: data.notes,
        grade: data.grade,
        gender: data.gender,
        club: data.club,
        hobbies: data.hobbies || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as StudentProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting student profile:', error);
    throw error;
  }
};

/**
 * 生徒プロフィールを作成または更新
 */
export const updateStudentProfile = async (
  userId: string, 
  data: Partial<StudentProfile>
): Promise<void> => {
  try {
    const docRef = doc(db, 'studentProfiles', userId);
    const docSnap = await getDoc(docRef);
    
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    // Timestamp変換
    if (updateData.previousConversations) {
      updateData.previousConversations = updateData.previousConversations.map((conv: any) => ({
        ...conv,
        date: Timestamp.fromDate(conv.date),
      }));
    }

    if (docSnap.exists()) {
      await updateDoc(docRef, updateData);
    } else {
      await setDoc(docRef, {
        id: userId,
        userId,
        interests: [],
        previousConversations: [],
        createdAt: new Date(),
        ...updateData,
      });
    }
  } catch (error) {
    console.error('Error updating student profile:', error);
    throw error;
  }
};

/**
 * 会話記録を追加
 */
export const addConversationHistory = async (
  userId: string,
  conversation: ConversationHistory
): Promise<void> => {
  try {
    const profile = await getStudentProfile(userId);
    const conversations = profile?.previousConversations || [];
    
    conversations.push(conversation);
    
    await updateStudentProfile(userId, {
      previousConversations: conversations,
    });
  } catch (error) {
    console.error('Error adding conversation history:', error);
    throw error;
  }
};

/**
 * 講師のメモを追加
 */
export const addInstructorNote = async (
  userId: string,
  note: string
): Promise<void> => {
  try {
    await updateStudentProfile(userId, { notes: note });
  } catch (error) {
    console.error('Error adding instructor note:', error);
    throw error;
  }
};

/**
 * 全ての生徒プロフィールを取得
 */
export const getAllStudentProfiles = async (): Promise<StudentProfile[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'studentProfiles'));
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        interests: data.interests || [],
        previousConversations: data.previousConversations?.map((conv: any) => ({
          ...conv,
          date: conv.date?.toDate() || new Date(),
        })) || [],
        notes: data.notes,
        grade: data.grade,
        gender: data.gender,
        club: data.club,
        hobbies: data.hobbies || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as StudentProfile;
    });
  } catch (error) {
    console.error('Error getting all student profiles:', error);
    throw error;
  }
};
