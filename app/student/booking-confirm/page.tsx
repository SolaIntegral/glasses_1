'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getInstructorWithUser } from '@/lib/firebase/instructors';
import { getAllAvailableSlots } from '@/lib/firebase/availability';
import { createBooking } from '@/lib/firebase/bookings';
import { useAuth } from '@/hooks/useAuth';
import { InstructorWithUser, AvailableSlot, SessionType } from '@/types';
import Loading from '@/components/ui/Loading';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

function BookingConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const instructorId = searchParams.get('instructorId');
  const slotId = searchParams.get('slotId');
  
  const [instructor, setInstructor] = useState<InstructorWithUser | null>(null);
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [consultationText, setConsultationText] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('recurring');
  const [questionsBeforeSession, setQuestionsBeforeSession] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!instructorId || !slotId) {
        setError('予約情報が見つかりません');
        setLoading(false);
        return;
      }

      try {
        const [instructorData, slotsData] = await Promise.all([
          getInstructorWithUser(instructorId),
          getAllAvailableSlots()
        ]);

        setInstructor(instructorData);
        
        const selectedSlot = slotsData.find(s => s.id === slotId);
        if (!selectedSlot) {
          setError('選択した時間枠が見つかりません');
          return;
        }
        setSlot(selectedSlot);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [instructorId, slotId]);

  const handleBooking = async () => {
    if (!user || !slot || !instructor) {
      setError('予約情報が不完全です');
      return;
    }

    setBookingLoading(true);
    setError('');

    try {
      const newBookingId = await createBooking(
        instructor.id,
        user.uid,
        slot.id,
        slot.startTime instanceof Date ? slot.startTime : new Date(slot.startTime),
        slot.endTime instanceof Date ? slot.endTime : new Date(slot.endTime),
        consultationText.trim() || '予約',
        consultationText.trim() || undefined,
        sessionType,
        sessionType === 'one-time' && consultationText ? [consultationText] : undefined
      );
      
      // 予約完了画面に遷移
      router.push(`/student/booking-complete?bookingId=${newBookingId}`);
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || '予約の作成に失敗しました');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !instructor || !slot) {
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

  const startTime = slot.startTime instanceof Date ? slot.startTime : new Date(slot.startTime);
  const endTime = slot.endTime instanceof Date ? slot.endTime : new Date(slot.endTime);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="p-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">予約確認</h1>
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
        {/* 予約内容カード */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">予約内容</h2>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-gray-700">
                講師名: <span className="font-semibold">{instructor.user.displayName}</span>
              </span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-700">
                日時: <span className="font-semibold">
                  {format(startTime, 'M月d日(E) HH:mm〜', { locale: ja })}
                  {format(endTime, 'HH:mm', { locale: ja })}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* セッションタイプ */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">セッションタイプ</h3>
          <div className="space-y-3">
            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
              <input
                type="radio"
                name="sessionType"
                value="one-time"
                checked={sessionType === 'one-time'}
                onChange={(e) => setSessionType(e.target.value as SessionType)}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">単発</div>
                <div className="text-sm text-gray-600">今回限りのセッション</div>
              </div>
            </label>
            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
              <input
                type="radio"
                name="sessionType"
                value="recurring"
                checked={sessionType === 'recurring'}
                onChange={(e) => setSessionType(e.target.value as SessionType)}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">定例</div>
                <div className="text-sm text-gray-600">継続的なセッション</div>
              </div>
            </label>
          </div>
        </div>

        {/* 相談したいこと */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">相談したいこと</h3>
          <textarea
            value={consultationText}
            onChange={(e) => setConsultationText(e.target.value)}
            placeholder="事前に伝えておきたい内容があればご記入ください"
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={500}
          />
          <div className="text-right text-sm text-gray-500 mt-2">
            {consultationText.length}/500文字
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        {/* 予約確定ボタン（固定） */}
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
          <button
            onClick={handleBooking}
            disabled={bookingLoading}
            className="w-full bg-blue-600 text-white py-4 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {bookingLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                予約処理中...
              </div>
            ) : (
              '予約を確定する'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BookingConfirmContent />
    </Suspense>
  );
}
