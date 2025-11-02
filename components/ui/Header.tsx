'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="text-xl sm:text-2xl font-bold text-blue-600">
            予約システム
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {user ? (
              <>
                <span className="text-sm lg:text-base text-gray-700">
                  <span className="hidden sm:inline">{user.displayName} さん</span>
                  <span className="sm:hidden">{user.displayName}</span>
                  <span className="text-xs ml-1 sm:ml-2 px-1 sm:px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {user.role === 'instructor' ? '講師' : '生徒'}
                  </span>
                </span>

                {user.role === 'instructor' ? (
                  <>
                    <Link href="/instructor/dashboard" className="text-sm lg:text-base text-gray-700 hover:text-blue-600">
                      ダッシュボード
                    </Link>
                    <Link href="/instructor/availability" className="text-sm lg:text-base text-gray-700 hover:text-blue-600">
                      空き時間管理
                    </Link>
                    <Link href="/instructor/bookings" className="text-sm lg:text-base text-gray-700 hover:text-blue-600">
                      予約一覧
                    </Link>
                    <Link href="/instructor/profile" className="text-sm lg:text-base text-gray-700 hover:text-blue-600">
                      プロフィール
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/student/instructors" className="text-sm lg:text-base text-gray-700 hover:text-blue-600">
                      講師一覧
                    </Link>
                    <Link href="/student/my-bookings" className="text-sm lg:text-base text-gray-700 hover:text-blue-600">
                      マイ予約
                    </Link>
                  </>
                )}

                <button
                  onClick={handleSignOut}
                  className="bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm lg:text-base text-gray-700 hover:text-blue-600">
                  ログイン
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  新規登録
                </Link>
              </>
            )}
          </nav>

          {/* モバイルナビゲーション */}
          <nav className="md:hidden flex items-center gap-2">
            {user ? (
              <>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {user.role === 'instructor' ? '講師' : '生徒'}
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors text-xs"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-xs text-gray-700 hover:text-blue-600">
                  ログイン
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs"
                >
                  登録
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

