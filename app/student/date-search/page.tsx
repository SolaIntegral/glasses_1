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
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentYear, currentMonth, i + 1);
    return date;
  }).filter(date => date >= todayStartOfDay); // 過去の日付は除外

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
            {days.map((date, index) => (
              <button
                key={index}
                onClick={() => handleDateSelect(date)}
                className={`
                  relative p-2 text-sm rounded-lg transition-colors
                  ${selectedDate && isSameDay(date, selectedDate)
                    ? 'bg-blue-600 text-white'
                    : hasAvailableSlots(date)
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'text-gray-400 hover:bg-gray-50'
                  }
                `}
              >
                {format(date, 'd')}
                {hasAvailableSlots(date) && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                )}
              </button>
            ))}
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
                  
                  return (
                    <div key={slot.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-gray-900">
                          {format(startTime, 'HH:mm')}〜{format(endTime, 'HH:mm')}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm">👨‍🏫</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {instructor?.user.displayName || '講師'}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/student/booking-confirm?instructorId=${slot.instructorId}&slotId=${slot.id}`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        予約
                      </Link>
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
