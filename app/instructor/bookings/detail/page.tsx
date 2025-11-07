'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getBookingById } from '@/lib/firebase/bookings';
import { Booking } from '@/types';
import Loading from '@/components/ui/Loading';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

function BookingDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError('予約情報が見つかりません');
        setLoading(false);
        return;
      }

      try {
        const bookingData = await getBookingById(bookingId);
        if (!bookingData) {
          setError('予約情報が見つかりません');
          return;
        }

        setBooking(bookingData);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('予約情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return <Loading />;
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="container mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error || '予約情報が見つかりません'}
          </div>
          <Link
            href="/instructor/bookings"
            className="text-blue-600 hover:text-blue-700"
          >
            予約一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const startTime = booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime);
  const endTime = booking.endTime instanceof Date ? booking.endTime : new Date(booking.endTime);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/instructor/bookings" className="p-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">予約詳細</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">予約情報</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日時</label>
              <p className="text-gray-900">
                {format(startTime, 'yyyy年MM月dd日(E) HH:mm', { locale: ja })} 〜 
                {format(endTime, 'HH:mm', { locale: ja })}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生徒ID</label>
              <p className="text-gray-900">{booking.studentId}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目的</label>
              <p className="text-gray-900">{booking.purpose || '-'}</p>
            </div>

            {booking.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                <p className="text-gray-900 whitespace-pre-wrap">{booking.notes}</p>
              </div>
            )}

            {booking.sessionType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">セッションタイプ</label>
                <p className="text-gray-900">
                  {booking.sessionType === 'one-time' ? '単発' : '定例'}
                </p>
              </div>
            )}

            {booking.questionsBeforeSession && booking.questionsBeforeSession.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">事前質問</label>
                <div className="space-y-2">
                  {booking.questionsBeforeSession.map((question, index) => (
                    <p key={index} className="text-gray-900 bg-gray-50 p-3 rounded">
                      {question}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {booking.meetingUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ミーティングリンク</label>
                <a
                  href={booking.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  {booking.meetingUrl}
                </a>
              </div>
            )}

            {booking.googleCalendarLink && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Googleカレンダー</label>
                <a
                  href={booking.googleCalendarLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  カレンダーで開く
                </a>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                booking.status === 'confirmed' 
                  ? 'bg-green-100 text-green-700' 
                  : booking.status === 'cancelled'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {booking.status === 'confirmed' ? '確定' : booking.status === 'cancelled' ? 'キャンセル済み' : booking.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BookingDetailContent />
    </Suspense>
  );
}

