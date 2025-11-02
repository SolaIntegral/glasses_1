'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface User {
  uid: string;
  email?: string;
  displayName: string;
  role: 'student' | 'instructor' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (userId: string, password: string) => Promise<User>;
  signUp: (userId: string, password: string, displayName: string, role: 'student' | 'instructor') => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => { throw new Error('AuthProvider not found'); },
  signUp: async () => { throw new Error('AuthProvider not found'); },
  signOut: async () => { throw new Error('AuthProvider not found'); },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // セッションIDからユーザー情報を取得
    const loadUser = async () => {
      console.log('loadUser called');
      const sessionId = localStorage.getItem('sessionId');
      console.log('sessionId from localStorage:', sessionId);
      
      if (sessionId) {
        // Firestoreからセッション情報を取得
        const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
        console.log('sessionDoc.exists():', sessionDoc.exists());
        
        if (sessionDoc.exists()) {
          const sessionData = sessionDoc.data();
          console.log('sessionData:', sessionData);
          
          // セッションの有効期限をチェック
          const expiresAt = sessionData.expiresAt?.toDate();
          console.log('expiresAt:', expiresAt);
          console.log('current time:', new Date());
          
          if (expiresAt && expiresAt < new Date()) {
            console.log('Session expired');
            // セッションが期限切れ
            localStorage.removeItem('sessionId');
            setUser(null);
            setLoading(false);
            return;
          }
          
          // ユーザー情報を取得
          const userDoc = await getDoc(doc(db, 'users', sessionData.userId));
          console.log('userDoc.exists():', userDoc.exists());
          console.log('userId:', sessionData.userId);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user = {
              uid: sessionData.userId,
              displayName: userData.displayName,
              role: userData.role,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
            };
            console.log('User loaded:', user);
            setUser(user);
          } else {
            // ユーザーが見つからない
            console.log('User not found');
            localStorage.removeItem('sessionId');
            setUser(null);
          }
        } else {
          // セッションが見つからない
          console.log('Session not found in Firestore');
          localStorage.removeItem('sessionId');
          setUser(null);
        }
      } else {
        console.log('No sessionId in localStorage');
        setUser(null);
      }
      console.log('Setting loading to false');
      setLoading(false);
    };

    loadUser();
  }, []);

  const signIn = async (userId: string, password: string): Promise<User> => {
    console.log('signIn called with userId:', userId);
    // Firestoreからユーザー情報を取得
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.error('User not found:', userId);
      throw new Error('ユーザーが見つかりません');
    }
    
    const userData = userDoc.data();
    console.log('User found, checking password...');
    
    // 簡易パスワード検証（base64エンコード）
    const hashedPassword = Buffer.from(password).toString('base64');
    console.log('Input hashedPassword:', hashedPassword);
    console.log('Stored hashedPassword:', userData?.hashedPassword);
    if (userData?.hashedPassword !== hashedPassword) {
      console.error('Password mismatch');
      throw new Error('パスワードが正しくありません');
    }
    
    console.log('Password verified successfully');
    
    // セッションIDを生成
    const sessionId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Firestoreにセッション情報を保存
    await setDoc(doc(db, 'sessions', sessionId), {
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日間有効
    });
    
    // localStorageにセッションIDのみ保存
    localStorage.setItem('sessionId', sessionId);
    
    // ユーザー情報を作成
    const user: User = {
      uid: userId,
      displayName: userData.displayName,
      role: userData.role,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
    };
    
    console.log('User created:', user);
    
    // ユーザー情報を即座に設定
    setUser(user);
    
    return user;
  };

  const signUp = async (userId: string, password: string, displayName: string, role: 'student' | 'instructor'): Promise<User> => {
    // 重複チェック
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      throw new Error('このユーザーIDは既に使用されています');
    }
    
    // パスワードをハッシュ化（簡易版）
    const hashedPassword = Buffer.from(password).toString('base64');
    
    // Firestoreにユーザー情報を保存
    await setDoc(doc(db, 'users', userId), {
      displayName,
      role,
      hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // 講師の場合は講師情報も作成
    if (role === 'instructor') {
      await setDoc(doc(db, 'instructors', userId), {
        userId,
        bio: '',
        specialties: [],
        profileImageUrl: '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    // セッションIDを生成
    const sessionId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Firestoreにセッション情報を保存
    await setDoc(doc(db, 'sessions', sessionId), {
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日間有効
    });
    
    // localStorageにセッションIDのみ保存
    localStorage.setItem('sessionId', sessionId);
    
    // ユーザー情報を作成
    const user: User = {
      uid: userId,
      displayName,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // ユーザー情報を即座に設定
    setUser(user);
    
    return user;
  };

  const signOut = async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      // Firestoreからセッションを削除
      const sessionRef = doc(db, 'sessions', sessionId);
      await setDoc(sessionRef, { deletedAt: new Date() }, { merge: true });
    }
    localStorage.removeItem('sessionId');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
