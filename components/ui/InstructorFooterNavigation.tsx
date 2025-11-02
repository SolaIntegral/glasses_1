'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function InstructorFooterNavigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2">
        {/* ホーム */}
        <Link
          href="/instructor/dashboard"
          className={`flex flex-col items-center py-2 px-3 ${
            isActive('/instructor/dashboard') ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xs font-medium">ホーム</span>
        </Link>

        {/* 予約一覧 */}
        <Link
          href="/instructor/bookings"
          className={`flex flex-col items-center py-2 px-3 ${
            isActive('/instructor/bookings') ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span className="text-xs font-medium">予約一覧</span>
        </Link>

        {/* スケジュール設定 */}
        <Link
          href="/instructor/availability"
          className={`flex flex-col items-center py-2 px-3 ${
            isActive('/instructor/availability') ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs font-medium">スケジュール</span>
        </Link>
      </div>
    </footer>
  );
}
