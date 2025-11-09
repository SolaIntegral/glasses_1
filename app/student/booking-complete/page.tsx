'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getBookingById } from '@/lib/firebase/bookings';
import { getInstructorWithUser } from '@/lib/firebase/instructors';
import { Booking, InstructorWithUser } from '@/types';
import Loading from '@/components/ui/Loading';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { resolveMeetingUrl } from '@/lib/utils/meeting';

interface BookingWithInstructor extends Booking {
  instructor?: InstructorWithUser;
}

function BookingCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  
  const [booking, setBooking] = useState<BookingWithInstructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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

        // 講師情報を取得
        const instructor = await getInstructorWithUser(bookingData.instructorId);
        if (instructor) {
          setBooking({
            ...bookingData,
            instructor
          });
        } else {
          setBooking(bookingData as any);
        }
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('予約情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleCopyUrl = async () => {
    if (booking?.meetingUrl) {
      try {
        await navigator.clipboard.writeText(booking.meetingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy URL:', err);
        // フォールバック: 手動でURLを選択
        const textArea = document.createElement('textarea');
        textArea.value = booking.meetingUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">エラー</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/student/dashboard"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const startTime = booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime);
  const endTime = booking.endTime instanceof Date ? booking.endTime : new Date(booking.endTime);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          {/* チェックマークアイコン */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* 完了メッセージ */}
          <h1 className="text-2xl font-bold text-gray-900 mb-6">予約が完了しました</h1>

          {/* 予約内容カード */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm text-gray-700">
                  講師名: <span className="font-semibold">{booking.instructor?.user.displayName}</span>
                </span>
              </div>
              
              <div className="flex items-center">
                <svg className="w-4 h-4 text-blue- await" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-700">
                  日時: <span className="font-semibold">
                    {format(startTime, 'M月d日(E) HH:mm〜', { locale: ja })}
                    {format(endTime, 'HH:mm', { locale: ja })}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* MTG URL */}
          {booking.meetingUrl && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">MTG URL</h3>
              <div className="bg-gray-100 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-700 break-all">
                  {resolveMeetingUrl(booking.meetingUrl)}
                </p>
              </div>
              <button
                onClick={handleCopyUrl}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:bg-gray-700 transition-colors"
              >
                {copied ? 'コピーしました' : 'URLをコピーする'}
              </button>
              <a
                href={resolveMeetingUrl(booking.meetingUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold text-sm text-center hover:bg-blue-700 transition-colors"
              >
                MTGに参加する
              </a>
            </div>
          )}

          {/* 生徒フォーム */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700 mb-3">
              セッション後、以下のフォームから感想をお願いします。
            </p>
            <a
              href="https://forms.gle/KjE5SGKXC3tfpMZUA"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold text-sm text-center hover:bg-blue-700 transition-colors"
            >
              セッション後レポートを記入する
            </a>
          </div>

          {/* アクションボタン */}
          <div className="space-y-3">
            <Link
              href="/student/my-bookings"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
            >
              予約履歴を見る
            </Link>
            
            <Link
              href="/student/dashboard"
              className="block w-full text-gray-600 py-2 px-4 rounded-lg font-semibold text-center hover:text-gray-800 transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingCompletePage() {
  return (
    <Suspense fallback={<Loading />}>
      <BookingCompleteContent />
    </Suspense>
  );
}
