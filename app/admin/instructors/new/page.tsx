'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function NewInstructor() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdAccount, setCreatedAccount] = useState<{ userId: string; password: string } | null>(null);

  const generateUserId = () => {
    return `instructor${Date.now()}`;
  };

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const finalUserId = userId || generateUserId();
      const finalPassword = autoGenerate ? generatePassword() : password;

      console.log('Creating instructor account...');
      console.log('finalUserId:', finalUserId);
      console.log('displayName:', displayName);

      // ユーザーIDの重複チェック
      const existingUser = await getDoc(doc(db, 'users', finalUserId));
      if (existingUser.exists()) {
        console.error('User ID already exists:', finalUserId);
        setError('このユーザーIDは既に使用されています');
        setLoading(false);
        return;
      }

      // パスワードをハッシュ化
      const hashedPassword = Buffer.from(finalPassword).toString('base64');

      // Firestoreにユーザー情報を保存
      console.log('Creating users document...');
      await setDoc(doc(db, 'users', finalUserId), {
        displayName,
        role: 'instructor',
        hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Users document created');

      // 講師情報を作成
      console.log('Creating instructors document...');
      await setDoc(doc(db, 'instructors', finalUserId), {
        userId: finalUserId,
        bio: '',
        specialties: [],
        meetingUrl: meetingUrl || '',
        slackMemberId: '',
        profileImageUrl: '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Instructors document created');

      console.log('Account creation completed successfully');
      setCreatedAccount({ userId: finalUserId, password: finalPassword });
    } catch (err: any) {
      console.error('Error creating account:', err);
      setError(err.message || 'アカウントの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (createdAccount) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">講師アカウントを作成しました</h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">ユーザーID</label>
                <div className="text-lg font-mono font-semibold text-gray-900">{createdAccount.userId}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
                <div className="text-lg font-mono font-semibold text-gray-900">{createdAccount.password}</div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Link
                href="/admin/instructors"
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
              >
                講師一覧に戻る
              </Link>
              <button
                onClick={() => {
                  setCreatedAccount(null);
                  setDisplayName('');
                  setUserId('');
                  setPassword('');
                  setMeetingUrl('');
                }}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-gray-700 transition-colors"
              >
                続けて作成
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/instructors" className="text-blue-600 hover:text-blue-700 flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            講師一覧に戻る
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">新規講師アカウント発行</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                講師ID
                <span className="text-xs text-gray-500 ml-2">(空欄の場合は自動生成されます)</span>
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="instructor001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                講師名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="田中 花子"
              />
            </div>

            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={autoGenerate}
                  onChange={(e) => setAutoGenerate(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">パスワードを自動生成する</span>
              </label>

              {!autoGenerate && (
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!autoGenerate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="パスワード"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                面談用URL
                <span className="text-xs text-gray-500 ml-2">(例: https://meet.google.com/xxx-xxxx-xxx)</span>
              </label>
              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '作成中...' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
