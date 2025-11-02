'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getBookingsByStudent, cancelBooking } from '@/lib/firebase/bookings';
import { getInstructorWithUser } from '@/lib/firebase/instructors';
import { Booking, InstructorWithUser } from '@/types';
import Loading from '@/components/ui/Loading';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface BookingWithInstructor extends Booking {
  instructor?: InstructorWithUser;
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        const userBookings = await getBookingsByStudent(user.uid);
        
        // 講師情報を取得して結合
        const bookingsWithInstructors: BookingWithInstructor[] = await Promise.all(
          userBookings.map(async (booking) => {
            try {
              const instructor = await getInstructorWithUser(booking.instructorId);
              return { ...booking, instructor: instructor || undefined };
            } catch (error) {
              console.error('Error fetching instructor:', error);
              return { ...booking, instructor: undefined };
            }
          })
        );

        setBookings(bookingsWithInstructors);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('予約情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const handleCancelBooking = async (booking: BookingWithInstructor) => {
    if (!confirm('この予約をキャンセルしますか？')) {
      return;
    }

    try {
      const startTime = booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime);
      await cancelBooking(booking.id);
      // 予約一覧を更新
      setBookings(prev => prev.filter(b => b.id !== booking.id));
    } catch (err: any) {
      console.error('Cancel booking error:', err);
      setError(err.message || 'キャンセルに失敗しました');
    }
  };

  const canCancel = (booking: Booking) => {
    const startTime = booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime);
    const now = new Date();
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilStart >= 24 && booking.status === 'confirmed';
  };

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              予約システム
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">予約履歴</h1>
            <button className="relative p-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
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
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">
                        {format(
                          booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime),
                          'M月d日(E) HH:mm〜',
                          { locale: ja }
                        )}
                        {format(
                          booking.endTime instanceof Date ? booking.endTime : new Date(booking.endTime),
                          'HH:mm',
                          { locale: ja }
                        )}
                      </div>
                      <div className="text-gray-600">
                        講師: {booking.instructor?.user.displayName}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      {booking.meetingUrl && (
                        <a
                          href={booking.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 text-center"
                        >
                          MTGに参加する
                        </a>
                      )}
                      {canCancel(booking) && (
                        <button
                          onClick={() => handleCancelBooking(booking)}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          予約をキャンセル
                        </button>
                      )}
                    </div>
                  </div>
                  {booking.consultationText && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <strong>相談内容:</strong> {booking.consultationText}
                    </div>
                  )}
                </div>
              ))
            )
          ) : (
            pastBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">過去の予約はありません。</p>
              </div>
            ) : (
              pastBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">
                        {format(
                          booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime),
                          'M月d日(E) HH:mm〜',
                          { locale: ja }
                        )}
                        {format(
                          booking.endTime instanceof Date ? booking.endTime : new Date(booking.endTime),
                          'HH:mm',
                          { locale: ja }
                        )}
                      </div>
                      <div className="text-gray-600">
                        講師: {booking.instructor?.user.displayName}
                      </div>
                      <div className="text-sm text-gray-500">
                        ステータス: {booking.status === 'cancelled' ? 'キャンセル済み' : '完了'}
                      </div>
                    </div>
                  </div>
                  {booking.consultationText && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <strong>相談内容:</strong> {booking.consultationText}
                    </div>
                  )}
                </div>
              ))
            )
          )}
        </div>
      </div>

    </div>
  );
}