'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllAvailableSlots } from '@/lib/firebase/availability';
import { getAllInstructorsWithUsers } from '@/lib/firebase/instructors';
import { AvailableSlot, InstructorWithUser } from '@/types';
import { format, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function DateSearchPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [allSlots, setAllSlots] = useState<AvailableSlot[]>([]);
  const [instructors, setInstructors] = useState<InstructorWithUser[]>([]);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [slotsData, instructorsData] = await Promise.all([
          getAllAvailableSlots(),
          getAllInstructorsWithUsers()
        ]);
        setAllSlots(slotsData);
        setInstructors(instructorsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    // 選択した日付のスロットをフィルター
    const daySlots = allSlots.filter(slot => {
      const slotDate = slot.startTime instanceof Date ? slot.startTime : new Date(slot.startTime);
      return isSameDay(slotDate, date);
    });

    setAvailableSlots(daySlots);
  };

  const hasAvailableSlots = (date: Date) => {
    // その日に利用可能なスロットがあるかを確認
    return allSlots.some(slot => {
      const slotDate = slot.startTime instanceof Date ? slot.startTime : new Date(slot.startTime);
      return isSameDay(slotDate, date);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/student/dashboard" className="p-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">日時から探す</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
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
              
              // 過去の日付は表示しない（グレーアウト）
              const isPast = date < todayStartOfDay;
              
              return (
                <button
                  key={index}
                  onClick={() => !isPast && handleDateSelect(date)}
                  disabled={isPast}
                  className={`
                    relative p-2 text-sm rounded-lg transition-colors
                    ${isPast
                      ? 'text-gray-300 cursor-not-allowed'
                      : selectedDate && isSameDay(date, selectedDate)
                      ? 'bg-blue-600 text-white'
                      : hasAvailableSlots(date)
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {format(date, 'd')}
                  {!isPast && hasAvailableSlots(date) && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 選択した日付の空き枠 */}
        {selectedDate && (
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {format(selectedDate, 'M月d日の空き枠', { locale: ja })}
            </h3>
            
            {availableSlots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">この日は予約可能な時間がありません。</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableSlots.map((slot) => {
                  const instructor = instructors.find(inst => inst.id === slot.instructorId);
                  const startTime = slot.startTime instanceof Date ? slot.startTime : new Date(slot.startTime);
                  const endTime = slot.endTime instanceof Date ? slot.endTime : new Date(slot.endTime);
                  const now = new Date();
                  const isPast = startTime <= now;
                  const hoursDiff = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                  const BOOKING_LIMIT_HOURS = 0;
                  const meetsLimit = BOOKING_LIMIT_HOURS === 0 ? true : hoursDiff >= BOOKING_LIMIT_HOURS;
                  const isSelectable = !isPast && meetsLimit;
                  
                  return (
                    <div key={slot.id} className={`flex items-center justify-between p-3 border rounded-lg ${
                      !isSelectable
                        ? 'border-gray-200 bg-gray-100 opacity-50'
                        : 'border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`text-sm font-medium ${!isSelectable ? 'text-gray-400' : 'text-gray-900'}`}>
                          {format(startTime, 'HH:mm')}〜{format(endTime, 'HH:mm')}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            !isSelectable ? 'bg-gray-200' : 'bg-blue-100'
                          }`}>
                            <span className="text-sm">👨‍🏫</span>
                          </div>
                          <span className={`text-sm font-medium ${!isSelectable ? 'text-gray-400' : 'text-gray-900'}`}>
                            {instructor?.user.displayName || '講師'}
                          </span>
                        </div>
                        {!isSelectable && (
                          <span className="text-xs text-gray-400">
                            {isPast
                              ? '時間が過ぎています'
                              : `予約は${BOOKING_LIMIT_HOURS}時間前までです`}
                          </span>
                        )}
                      </div>
                      {isSelectable ? (
                        <Link
                          href={`/student/booking-confirm?instructorId=${slot.instructorId}&slotId=${slot.id}`}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          予約
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-300 text-gray-500 text-sm rounded-lg cursor-not-allowed"
                        >
                          予約不可
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
