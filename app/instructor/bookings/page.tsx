'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getBookingsByInstructor } from '@/lib/firebase/bookings';
import { Booking } from '@/types';
import Loading from '@/components/ui/Loading';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { resolveMeetingUrl } from '@/lib/utils/meeting';

export default function InstructorBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        const instructorBookings = await getBookingsByInstructor(user.uid);
        setBookings(instructorBookings);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('予約情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  if (loading) {
    return <Loading />;
  }

  const now = new Date();
  const upcomingBookings = bookings.filter(booking => {
    const startTime = booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime);
    return startTime > now && booking.status === 'confirmed';
  });

  const pastBookings = bookings.filter(booking => {
    const startTime = booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime);
    return startTime <= now || booking.status === 'cancelled';
  });

  // 時間順にソート
  upcomingBookings.sort((a, b) => {
    const timeA = a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
    const timeB = b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
    return timeA.getTime() - timeB.getTime();
  });

  pastBookings.sort((a, b) => {
    const timeA = a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
    const timeB = b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
    return timeB.getTime() - timeA.getTime(); // 新しい順
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <h1 className="text-lg font-semibold text-gray-900">予約一覧</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* タブ */}
        <div className="flex bg-white rounded-lg shadow mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-3 px-4 text-center font-semibold rounded-l-lg transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            これからの予約
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-3 px-4 text-center font-semibold rounded-r-lg transition-colors ${
              activeTab === 'past'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            過去の予約
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        {/* 予約一覧 */}
        <div className="space-y-4">
          {activeTab === 'upcoming' ? (
            upcomingBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">今後の予約はありません。</p>
              </div>
            ) : (
              upcomingBookings.map((booking) => {
                const startTime = booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime);
                
                return (
                  <div key={booking.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          {format(startTime, 'M月d日(E) HH:mm', { locale: ja })}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          生徒ID: {booking.studentId}
                        </div>
                        {booking.sessionType && (
                          <div className="mb-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              booking.sessionType === 'one-time'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {booking.sessionType === 'one-time' ? '単発' : '定例'}
                            </span>
                          </div>
                        )}
                        {booking.consultationText && (
                          <div className="text-sm text-gray-700 line-clamp-2">
                            {booking.consultationText.substring(0, 50)}
                            {booking.consultationText.length > 50 ? '...' : ''}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        <Link
                          href={`/instructor/bookings/detail?id=${booking.id}`}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors text-center"
                        >
                          詳細
                        </Link>
                        {booking.meetingUrl && (
                          <a
                            href={resolveMeetingUrl(booking.meetingUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors text-center"
                          >
                            MTG参加
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            pastBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">過去の予約はありません。</p>
              </div>
            ) : (
              pastBookings.map((booking) => {
                const startTime = booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime);
                
                return (
                  <div key={booking.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          {format(startTime, 'M月d日(E) HH:mm', { locale: ja })}
                        </div>
                        <div className="text-sm text-gray-600">
                          生徒ID: {booking.studentId}
                        </div>
                        {booking.sessionType && (
                          <div className="mb-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              booking.sessionType === 'one-time'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {booking.sessionType === 'one-time' ? '単発' : '定例'}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {booking.status === 'cancelled' ? 'キャンセル済み' : '完了'}
                        </div>
                      </div>
                      {booking.meetingUrl && booking.status !== 'cancelled' && (
                        <div className="ml-4">
                          <a
                            href="https://forms.gle/jhn2674CETV3L3qN8"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            レポート入力
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* 講師フォームリンク */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">セッション後レポート</h3>
          <p className="text-sm text-gray-700 mb-3">
            セッション終了後、以下のフォームからレポートを入力してください。
          </p>
          <a
            href="https://forms.gle/jhn2674CETV3L3qN8"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
          >
            セッション後レポートを入力する
          </a>
        </div>
      </div>

    </div>
  );
}