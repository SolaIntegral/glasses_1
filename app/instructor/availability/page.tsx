'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getAvailableSlotsByInstructor, deleteAvailableSlot } from '@/lib/firebase/availability';
import { getBookingsByInstructor } from '@/lib/firebase/bookings';
import { AvailableSlot, Booking } from '@/types';
import Loading from '@/components/ui/Loading';
import { format, isSameDay, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function AvailabilityPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [slotsData, bookingsData] = await Promise.all([
          getAvailableSlotsByInstructor(user.uid),
          getBookingsByInstructor(user.uid)
        ]);

        setSlots(slotsData);
        setBookings(bookingsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDeleteSlot = async (slotId: string) => {
    // スロットが予約済みかチェック
    const isBooked = bookings.some(booking => 
      booking.slotId === slotId && booking.status === 'confirmed'
    );

    if (isBooked) {
      alert('予約済みの枠は削除できません');
      return;
    }

    if (!confirm('この枠を削除しますか？')) {
      return;
    }

    try {
      await deleteAvailableSlot(slotId);
      setSlots(prev => prev.filter(slot => slot.id !== slotId));
    } catch (err) {
      console.error('Error deleting slot:', err);
      setError('削除に失敗しました');
    }
  };

  const getSlotsForDate = (date: Date) => {
    return slots.filter(slot => {
      const slotDate = slot.startTime instanceof Date ? slot.startTime : new Date(slot.startTime);
      return isSameDay(slotDate, date);
    });
  };

  const hasSlots = (date: Date) => {
    return getSlotsForDate(date).length > 0;
  };

  const isSlotBooked = (slotId: string) => {
    return bookings.some(booking => 
      booking.slotId === slotId && booking.status === 'confirmed'
    );
  };

  if (loading) {
    return <Loading />;
  }

  // 今月の日付を生成
  const today = new Date();
  const todayStartOfDay = startOfDay(today);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // 月の最初の日を取得
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  // 月の最初の日の曜日を取得（0=日曜日、1=月曜日、...、6=土曜日）
  const firstDayOfWeek = firstDayOfMonth.getDay();
  
  // カレンダー表示用の配列（最初の日の前の空セル + 日付）
  const calendarDays: (Date | null)[] = [];
  
  // 最初の日の前の空セルを追加
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // 全ての日付を生成して追加
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    calendarDays.push(date);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <h1 className="text-lg font-semibold text-gray-900">スケジュール設定</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        {/* カレンダー */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {format(today, 'yyyy年M月', { locale: ja })}
          </h2>
          
          <div className="grid grid-cols-7 gap-2">
            {/* 曜日ヘッダー */}
            {['日', '月', '火', '水', '木', '金', '土'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            
            {/* 日付 */}
            {calendarDays.map((date, index) => {
              if (date === null) {
                // 空セル
                return <div key={`empty-${index}`} className="p-2"></div>;
              }
              
              const daySlots = getSlotsForDate(date);
              const hasBookedSlots = daySlots.some(slot => isSlotBooked(slot.id));
              const isPast = date < todayStartOfDay;
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  className={`
                    relative p-2 text-sm rounded-lg transition-colors
                    ${isPast
                      ? 'text-gray-300 cursor-not-allowed'
                      : selectedDate && isSameDay(date, selectedDate)
                      ? 'bg-blue-600 text-white'
                      : hasSlots(date)
                      ? hasBookedSlots
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {format(date, 'd')}
                  {!isPast && hasSlots(date) && (
                    <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                      hasBookedSlots ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 選択した日付の予約枠 */}
        {selectedDate && (
          <div className="bg-white rounded-lg shadow p-4 mb-20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {format(selectedDate, 'M月d日の予約枠', { locale: ja })}
            </h3>
            
            {getSlotsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">この日は予約枠がありません。</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getSlotsForDate(selectedDate).map((slot) => {
                  const startTime = slot.startTime instanceof Date ? slot.startTime : new Date(slot.startTime);
                  const endTime = slot.endTime instanceof Date ? slot.endTime : new Date(slot.endTime);
                  const booked = isSlotBooked(slot.id);
                  
                  return (
                    <div 
                      key={slot.id} 
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        booked ? 'border-green-200 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="font-medium text-gray-900">
                          {format(startTime, 'HH:mm')}〜{format(endTime, 'HH:mm')}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booked 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {booked ? '予約済み' : '予約可'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 新しい予約枠を追加するボタン（固定） */}
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <Link
            href={`/instructor/availability/add${selectedDate ? `?date=${selectedDate.toISOString()}` : ''}`}
            className="block w-full bg-blue-600 text-white py-4 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
          >
            新しい予約枠を追加する
          </Link>
        </div>
      </div>

    </div>
  );
}