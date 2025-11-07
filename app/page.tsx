'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    const dashboardPaths = ['/admin', '/instructor', '/student'];
    const isInDashboardArea = dashboardPaths.some(path => pathname.startsWith(path));

    if (!user) {
      if (isRedirecting) {
        setIsRedirecting(false);
      }
      return;
    }

    if (isInDashboardArea) {
      if (isRedirecting) {
        setIsRedirecting(false);
      }
      return;
    }

    if (!isRedirecting) {
      setIsRedirecting(true);
    }

    if (user.role === 'admin') {
      router.replace('/admin/dashboard');
    } else if (user.role === 'instructor') {
      router.replace('/instructor/dashboard');
    } else {
      router.replace('/student/dashboard');
    }
  }, [user, loading, router, pathname, isRedirecting]);

  // ローディング中またはリダイレクト中
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {loading ? '読み込み中...' : 'リダイレクト中...'}
          </p>
        </div>
      </div>
    );
  }

  // ログイン済みユーザーがホームページにいる場合（リダイレクトが完了するまで）
  if (user && pathname === '/') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">リダイレクト中...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* ヒーロー セクション */}
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            講師・生徒マッチング
            <span className="block text-blue-600 mt-2">予約システム</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-12 px-4">
            講師のプロフィールと空き時間を確認して、好きな時間にMTGを予約できます。
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>予約後は自動的に講師に通知が届きます。
          </p>

          {/* CTA ボタン */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4">
            <Link
              href="/auth/login"
              className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-700 transition-colors text-center"
            >
              ログイン
            </Link>
          </div>

          {/* 主要機能 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-12 sm:mt-16 px-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">👨‍🏫</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">講師プロフィール</h3>
              <p className="text-sm sm:text-base text-gray-600">
                講師の専門分野や経歴を確認して、最適な講師を選べます。
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📅</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">簡単予約</h3>
              <p className="text-sm sm:text-base text-gray-600">
                カレンダーから空き時間を選んで、ワンクリックで予約完了。
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md sm:col-span-2 lg:col-span-1">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🔔</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">自動通知</h3>
              <p className="text-sm sm:text-base text-gray-600">
                予約が完了すると、Slackとメールで自動的に通知されます。
              </p>
            </div>
          </div>

          {/* システム要件 */}
          <div className="mt-12 sm:mt-16 bg-blue-50 p-4 sm:p-6 lg:p-8 rounded-lg mx-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">システム概要</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
              <div>
                <p className="text-sm sm:text-base font-semibold text-gray-700">✅ MTG時間: 30分固定</p>
                <p className="text-sm sm:text-base font-semibold text-gray-700">✅ 予約可能期間: 2週間先まで</p>
              </div>
              <div>
                <p className="text-sm sm:text-base font-semibold text-gray-700">✅ 予約制限: 2時間前まで</p>
                <p className="text-sm sm:text-base font-semibold text-gray-700">✅ キャンセル: 24時間前まで可能</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

