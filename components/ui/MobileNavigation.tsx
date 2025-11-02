'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function MobileNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return pathname === path;
  };

  if (!user) return null;

  // 生徒用ナビゲーション
  if (user.role === 'student') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center py-2">
          {/* ホーム */}
          <Link
            href="/student/dashboard"
            className={`flex flex-col items-center py-2 px-3 ${
              isActive('/student/dashboard') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">ホーム</span>
          </Link>

          {/* 講師検索 */}
          <Link
            href="/student/instructors"
            className={`flex flex-col items-center py-2 px-3 ${
              isActive('/student/instructors') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs font-medium">講師検索</span>
          </Link>

          {/* 日付検索 */}
          <Link
            href="/student/date-search"
            className={`flex flex-col items-center py-2 px-3 ${
              isActive('/student/date-search') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">日付検索</span>
          </Link>

          {/* 予約履歴 */}
          <Link
            href="/student/my-bookings"
            className={`flex flex-col items-center py-2 px-3 ${
              isActive('/student/my-bookings') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-medium">予約履歴</span>
          </Link>

          {/* 通知 */}
          <Link
            href="/student/notifications"
            className={`flex flex-col items-center py-2 px-3 ${
              isActive('/student/notifications') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-xs font-medium">通知</span>
          </Link>
        </div>
      </nav>
    );
  }

  // 講師用ナビゲーション
  if (user.role === 'instructor') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center py-2">
          {/* ダッシュボード */}
          <Link
            href="/instructor/dashboard"
            className={`flex flex-col items-center py-2 px-3 ${
              isActive('/instructor/dashboard') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">ダッシュボード</span>
          </Link>

          {/* 空き時間 */}
          <Link
            href="/instructor/availability"
            className={`flex flex-col items-center py-2 px-3 ${
              isActive('/instructor/availability') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">空き時間</span>
          </Link>

          {/* 予約一覧 */}
          <Link
            href="/instructor/bookings"
            className={`flex flex-col items-center py-2 px-3 ${
              isActive('/instructor/bookings') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">予約一覧</span>
          </Link>

          {/* プロフィール */}
          <Link
            href="/instructor/profile"
            className={`flex flex-col items-center py-2 px-3 ${
              isActive('/instructor/profile') ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-medium">プロフィール</span>
          </Link>
        </div>
      </nav>
    );
  }

  return null;
}
