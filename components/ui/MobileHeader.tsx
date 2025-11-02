'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function MobileHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="text-lg font-bold text-blue-600">
            予約システム
          </Link>

          {/* 右側のメニュー */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* 通報リンク */}
                <Link
                  href="/report"
                  className="px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  通報
                </Link>

                {/* ユーザー情報 */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">
                    {user.displayName}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {user.role === 'instructor' ? '講師' : '生徒'}
                  </span>
                </div>

                {/* ログアウトボタン */}
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-700 hover:text-blue-600"
                >
                  ログイン
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  新規登録
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
