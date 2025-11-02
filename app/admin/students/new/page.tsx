'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { updateStudentProfile } from '@/lib/firebase/studentProfiles';

export default function NewStudent() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  // MVP要件で追加
  const [grade, setGrade] = useState('');
  const [gender, setGender] = useState('');
  const [club, setClub] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdAccount, setCreatedAccount] = useState<{ userId: string; password: string } | null>(null);

  const generateUserId = () => {
    return `student${Date.now()}`;
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

      // ユーザーIDの重複チェック
      const existingUser = await getDoc(doc(db, 'users', finalUserId));
      if (existingUser.exists()) {
        setError('このユーザーIDは既に使用されています');
        setLoading(false);
        return;
      }

      // パスワードをハッシュ化
      const hashedPassword = Buffer.from(finalPassword).toString('base64');

      // Firestoreにユーザー情報を保存
      await setDoc(doc(db, 'users', finalUserId), {
        displayName,
        role: 'student',
        hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 生徒プロフィール情報を保存
      const hobbiesArray = hobbies
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      await updateStudentProfile(finalUserId, {
        grade,
        gender,
        club,
        hobbies: hobbiesArray,
      });

      // 作成したアカウント情報を表示
      setCreatedAccount({ userId: finalUserId, password: finalPassword });
    } catch (err: any) {
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">アカウントを作成しました</h2>
              <p className="text-gray-600">以下の情報を生徒に伝えてください</p>
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
                href="/admin/students"
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
              >
                生徒一覧に戻る
              </Link>
              <button
                onClick={() => {
                  setCreatedAccount(null);
                  setDisplayName('');
                  setUserId('');
                  setPassword('');
                  setGrade('');
                  setGender('');
                  setClub('');
                  setHobbies('');
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
          <Link href="/admin/students" className="text-blue-600 hover:text-blue-700 flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            生徒一覧に戻る
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">新規生徒アカウント発行</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                生徒ID
                <span className="text-xs text-gray-500 ml-2">(空欄の場合は自動生成されます)</span>
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="student001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                氏名（ニックネーム） <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="山田 太郎"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">学年</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                <option value="1年生">1年生</option>
                <option value="2年生">2年生</option>
                <option value="3年生">3年生</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">性別</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">選択してください</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">部活（あれば）</label>
              <input
                type="text"
                value={club}
                onChange={(e) => setClub(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="野球部"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                趣味、好きなこと
                <span className="text-xs text-gray-500 ml-2">（カンマ区切りで入力）</span>
              </label>
              <input
                type="text"
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="読書, 映画鑑賞"
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
