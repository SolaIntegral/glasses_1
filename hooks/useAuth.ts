'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { logAppEvent } from '@/lib/firebase/logger';

const SESSION_USER_CACHE_KEY = 'sessionUser';

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

  const readCachedUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(SESSION_USER_CACHE_KEY);
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.uid && parsed.role) {
        return {
          uid: parsed.uid,
          displayName: parsed.displayName,
          role: parsed.role,
          createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
          updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
        };
      }
    } catch (err) {
      console.warn('Failed to parse cached session user', err);
    }
    return null;
  };

  const writeCachedUser = (value: User | null) => {
    if (typeof window === 'undefined') return;
    if (!value) {
      localStorage.removeItem(SESSION_USER_CACHE_KEY);
      return;
    }
    localStorage.setItem(
      SESSION_USER_CACHE_KEY,
      JSON.stringify({
        uid: value.uid,
        displayName: value.displayName,
        role: value.role,
        createdAt: value.createdAt,
        updatedAt: value.updatedAt,
      })
    );
  };

  useEffect(() => {
    // セッションIDからユーザー情報を取得
    const loadUser = async () => {
      console.log('loadUser called');
      const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const logResult = async (
        result:
          | 'success'
          | 'noSession'
          | 'sessionNotFound'
          | 'sessionExpired'
          | 'userNotFound'
          | 'error',
        options: { userId?: string; role?: User['role']; metadata?: Record<string, any> } = {}
      ) => {
        const durationMs = Math.round(
          (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
        );
        await logAppEvent('auth:sessionChecked', {
          userId: options.userId,
          role: options.role,
          metadata: {
            result,
            durationMs,
            ...(options.metadata || {}),
          },
          severity: result === 'error' ? 'error' : 'info',
        });
      };

      let usedCache = false;
      const cachedUser = readCachedUser();
      if (cachedUser) {
        console.log('Loaded cached session user:', cachedUser.uid);
        setUser(cachedUser);
        setLoading(false);
        usedCache = true;
      }

      const sessionId = localStorage.getItem('sessionId');
      console.log('sessionId from localStorage:', sessionId);
      
      if (sessionId) {
        // Firestoreからセッション情報を取得
        const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
        console.log('sessionDoc.exists():', sessionDoc.exists());
        
        if (sessionDoc.exists()) {
          const sessionData = sessionDoc.data();
          console.log('sessionData:', sessionData);
          const sessionUserId: string | undefined = sessionData.userId;
          
          // セッションの有効期限をチェック
          const expiresAt = sessionData.expiresAt?.toDate();
          console.log('expiresAt:', expiresAt);
          console.log('current time:', new Date());
          
          if (expiresAt && expiresAt < new Date()) {
            console.log('Session expired');
            // セッションが期限切れ
            localStorage.removeItem('sessionId');
            writeCachedUser(null);
            setUser(null);
            await logResult('sessionExpired', {
              userId: sessionUserId,
              metadata: { expiresAt: expiresAt?.toISOString() },
            });
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
            writeCachedUser(user);
            await logResult('success', {
              userId: user.uid,
              role: user.role,
              metadata: { fromCache: usedCache },
            });
          } else {
            // ユーザーが見つからない
            console.log('User not found');
            localStorage.removeItem('sessionId');
            writeCachedUser(null);
            setUser(null);
            await logResult('userNotFound', { userId: sessionUserId });
          }
        } else {
          // セッションが見つからない
          console.log('Session not found in Firestore');
          localStorage.removeItem('sessionId');
          writeCachedUser(null);
          setUser(null);
          await logResult('sessionNotFound', { metadata: { sessionId } });
        }
      } else {
        console.log('No sessionId in localStorage');
        writeCachedUser(null);
        setUser(null);
        await logResult('noSession');
      }
      console.log('Setting loading to false');
      if (!usedCache) {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (userId: string, password: string): Promise<User> => {
    console.log('signIn called with userId:', userId);
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    // Firestoreからユーザー情報を取得
    let alreadyLogged = false;
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        console.error('User not found:', userId);
        await logAppEvent('auth:signInFailed', {
          userId,
          severity: 'error',
          metadata: { reason: 'user_not_found' },
        });
        alreadyLogged = true;
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
        await logAppEvent('auth:signInFailed', {
          userId,
          severity: 'error',
          metadata: { reason: 'invalid_password' },
        });
        alreadyLogged = true;
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
      writeCachedUser(user);
      
      const durationMs = Math.round(
        (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
      );
      await logAppEvent('auth:signIn', {
        userId,
        role: user.role,
        metadata: { result: 'success', durationMs },
      });
      
      return user;
    } catch (error: any) {
      if (!alreadyLogged) {
        await logAppEvent('auth:signInFailed', {
          userId,
          severity: 'error',
          metadata: {
            reason: 'unexpected_error',
            message: error?.message,
          },
        });
      }
      throw error;
    }
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
    writeCachedUser(user);
    
    return user;
  };

  const signOut = async (options: { reason?: string } = {}) => {
    const sessionId = localStorage.getItem('sessionId');
    const currentUser = user;
    if (sessionId) {
      // Firestoreからセッションを削除
      const sessionRef = doc(db, 'sessions', sessionId);
      await setDoc(sessionRef, { deletedAt: new Date() }, { merge: true });
    }
    localStorage.removeItem('sessionId');
    writeCachedUser(null);
    setUser(null);
    await logAppEvent('auth:signOut', {
      userId: currentUser?.uid,
      role: currentUser?.role,
      metadata: { result: 'success', reason: options.reason || 'manual' },
      severity: options.reason && options.reason !== 'manual' ? 'warn' : 'info',
    });
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
