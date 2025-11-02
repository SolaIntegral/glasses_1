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
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { Instructor, User, Education, WorkHistory } from '@/types';

// 講師作成（Firestore版）
export const createInstructor = async (
  userId: string,
  displayName: string,
  specialties: string[],
  bio: string,
  profileImageUrl?: string
): Promise<string> => {
  const instructorData = {
    userId,
    displayName,
    specialties,
    bio,
    profileImageUrl: profileImageUrl || '',
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'instructors'), instructorData);
  return docRef.id;
};

// 講師情報取得（Firestore版）
export const getInstructor = async (userId: string): Promise<Instructor | null> => {
  const q = query(
    collection(db, 'instructors'),
    where('userId', '==', userId)
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  const data = doc.data();
  
  return {
    id: doc.id,
    userId: data.userId,
    specialties: data.specialties,
    bio: data.bio,
    profileImageUrl: data.profileImageUrl,
    isActive: data.isActive,
    meetingUrl: data.meetingUrl,
    gender: data.gender,
    currentIndustry: data.currentIndustry,
    currentOccupation: data.currentOccupation,
    currentJobTitle: data.currentJobTitle,
    education: data.education,
    workHistory: data.workHistory,
    hobbies: data.hobbies,
    highSchoolClub: data.highSchoolClub,
    messageToStudents: data.messageToStudents,
    slackMemberId: data.slackMemberId,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as Instructor;
};

// 講師情報取得（document IDで直接取得 - 管理者用）
export const getInstructorByDocId = async (docId: string): Promise<Instructor | null> => {
  const instructorDoc = await getDoc(doc(db, 'instructors', docId));
  
  if (!instructorDoc.exists()) {
    return null;
  }

  const data = instructorDoc.data();
  
  return {
    id: instructorDoc.id,
    userId: data.userId,
    specialties: data.specialties,
    bio: data.bio,
    profileImageUrl: data.profileImageUrl,
    isActive: data.isActive,
    meetingUrl: data.meetingUrl,
    gender: data.gender,
    currentIndustry: data.currentIndustry,
    currentOccupation: data.currentOccupation,
    currentJobTitle: data.currentJobTitle,
    education: data.education,
    workHistory: data.workHistory,
    hobbies: data.hobbies,
    highSchoolClub: data.highSchoolClub,
    messageToStudents: data.messageToStudents,
    slackMemberId: data.slackMemberId,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as Instructor;
};

// 講師情報更新（Firestore版）
export const updateInstructor = async (
  userId: string,
  updates: Partial<Instructor>
): Promise<void> => {
  const q = query(
    collection(db, 'instructors'),
    where('userId', '==', userId)
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    throw new Error('講師が見つかりません');
  }

  const docRef = querySnapshot.docs[0].ref;
  const updateData = {
    ...updates,
    updatedAt: Timestamp.now(),
  };

  await updateDoc(docRef, updateData);
};

// 全講師一覧取得（Firestore版）
export const getAllInstructors = async (): Promise<Instructor[]> => {
  // インデックス未作成のため、フィルタのみで取得してクライアント側でソート
  const q = query(
    collection(db, 'instructors'),
    where('isActive', '==', true)
  );
  
  const querySnapshot = await getDocs(q);
  const instructors = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      specialties: data.specialties,
      bio: data.bio,
      profileImageUrl: data.profileImageUrl,
      isActive: data.isActive,
      meetingUrl: data.meetingUrl,
      gender: data.gender,
      currentIndustry: data.currentIndustry,
      currentOccupation: data.currentOccupation,
      currentJobTitle: data.currentJobTitle,
      education: data.education,
      workHistory: data.workHistory,
      hobbies: data.hobbies,
      highSchoolClub: data.highSchoolClub,
      messageToStudents: data.messageToStudents,
      slackMemberId: data.slackMemberId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Instructor;
  });
  
  // クライアント側でソート（userIdでソート）
  return instructors.sort((a, b) => a.userId.localeCompare(b.userId));
};

// 講師とユーザー情報を結合して取得（Firestore版）
export const getInstructorWithUser = async (userId: string): Promise<Instructor & { user: User } | null> => {
  const instructor = await getInstructor(userId);
  if (!instructor) {
    return null;
  }

  // ユーザー情報を取得
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    return null;
  }

  const userData = userDoc.data();
  const user: User = {
    uid: userId,
    userId: userId,
    displayName: userData.displayName,
    role: userData.role,
    createdAt: userData.createdAt.toDate(),
    updatedAt: userData.updatedAt.toDate(),
  };

  return {
    ...instructor,
    user,
  };
};

// 講師一覧取得（ユーザー情報付き）
export const getAllInstructorsWithUsers = async (): Promise<(Instructor & { user: User })[]> => {
  const instructors = await getAllInstructors();
  const instructorWithUsers: (Instructor & { user: User })[] = [];

  for (const instructor of instructors) {
    const userDoc = await getDoc(doc(db, 'users', instructor.userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const user: User = {
        uid: instructor.userId,
        userId: instructor.userId,
        displayName: userData.displayName,
        role: userData.role,
        createdAt: userData.createdAt.toDate(),
        updatedAt: userData.updatedAt.toDate(),
      };
      
      instructorWithUsers.push({
        ...instructor,
        user,
      });
    }
  }

  return instructorWithUsers;
};

// 講師削除（Firestore版）
export const deleteInstructor = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, 'instructors'),
    where('userId', '==', userId)
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    throw new Error('講師が見つかりません');
  }

  await deleteDoc(querySnapshot.docs[0].ref);
};