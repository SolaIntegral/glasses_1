'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getBookingsByInstructor } from '@/lib/firebase/bookings';
import { Booking } from '@/types';
import Loading from '@/components/ui/Loading';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        const instructorBookings = await getBookingsByInstructor(user.uid);
        setBookings(instructorBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  if (loading) {
    return <Loading />;
  }

  // 今後の予約を取得
  const now = new Date();
  const upcomingBookings = bookings.filter(booking => {
    const startTime = booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime);
    return startTime > now && booking.status === 'confirmed';
  });

  // 今後の予約を時間順にソート
  upcomingBookings.sort((a, b) => {
    const timeA = a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
    const timeB = b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
    return timeA.getTime() - timeB.getTime();
  });

  const nextBooking = upcomingBookings[0];

  // 新着の予約（仮の実装：直近24時間以内の予約）
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const newBookings = upcomingBookings.filter(booking => {
    const createdAt = booking.createdAt instanceof Date ? booking.createdAt : new Date(booking.createdAt);
    return createdAt > oneDayAgo;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              予約システム
            </Link>
            <Link href="/instructor/profile" className="p-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* 次の予約カード */}
        {nextBooking && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">次の予約</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-700">
                  {format(
                    nextBooking.startTime instanceof Date ? nextBooking.startTime : new Date(nextBooking.startTime),
                    'M月d日 HH:mm〜',
                    { locale: ja }
                  )}
                </span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-gray-700">生徒ID: {nextBooking.studentId}</span>
              </div>
              {nextBooking.meetingUrl && (
                <a
                  href={nextBooking.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
                >
                  MTGに参加する
                </a>
              )}
            </div>
          </div>
        )}

        {/* 新着の予約カード */}
        {newBookings.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6 mb-6">
            <div className="flex items-center mb-3">
              <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="text-lg font-semibold text-blue-900">新着の予約</h3>
            </div>
            <p className="text-blue-800 mb-4">{newBookings.length}件の新しい予約があります</p>
            <Link
              href="/instructor/bookings"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
            >
              一覧で確認する
            </Link>
          </div>
        )}

        {/* スケジュール設定ボタン */}
        <Link
          href="/instructor/availability"
          className="block w-full bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">スケジュールを設定する</h3>
              <p className="text-sm text-gray-600">予約可能な時間枠を管理</p>
            </div>
          </div>
        </Link>
      </div>

    </div>
  );
}