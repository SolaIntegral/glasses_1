'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  usePerformanceMonitor('auth-login', { thresholdMs: 2000 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem('pendingRedirect');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
        if (parsed.role) {
          setReason(
            parsed.reason === 'wrong-role'
              ? '別の権限のページにアクセスしたため、改めてログインが必要です。'
              : 'ログイン状態が確認できなかったため、再度ログインしてください。'
          );
        }
      }
    } catch (err) {
      console.warn('Failed to parse pendingRedirect', err);
    } finally {
      sessionStorage.removeItem('pendingRedirect');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log('handleSubmit called', e.type);
    e.preventDefault();
    console.log('preventDefault called');
    
    setError('');
    setLoading(true);

    try {
      console.log('Attempting to login with userId:', userId);
      const loggedInUser = await signIn(userId, password);
      console.log('Login successful, user role:', loggedInUser.role);
      
      // ロールに応じてリダイレクト
      if (loggedInUser.role === 'admin') {
        console.log('Redirecting to admin dashboard');
        router.push('/admin/dashboard');
      } else if (loggedInUser.role === 'instructor') {
        console.log('Redirecting to instructor dashboard');
        router.push('/instructor/dashboard');
      } else {
        console.log('Redirecting to student dashboard');
        router.push('/student/dashboard');
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error message:', err.message);
      setError('ユーザーIDまたはパスワードが正しくありません');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6 sm:mb-8">
            ログイン
          </h1>

          {reason && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 sm:px-4 py-3 rounded mb-4 text-sm sm:text-base">
              {reason}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded mb-4 text-sm sm:text-base">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                ユーザーID
              </label>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ユーザーIDを入力"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="パスワードを入力"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}