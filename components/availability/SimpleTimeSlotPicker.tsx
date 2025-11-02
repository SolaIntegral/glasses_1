'use client';

import { useState } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface SimpleTimeSlotPickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedTimeSlots: string[];
  onTimeSlotToggle: (time: string) => void;
  startTime: string;
  endTime: string;
}

export default function SimpleTimeSlotPicker({
  selectedDate,
  onDateChange,
  selectedTimeSlots,
  onTimeSlotToggle,
  startTime,
  endTime
}: SimpleTimeSlotPickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  
  // 30分間隔のタイムスロットを生成
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      
      slots.push({
        time: timeString,
        available: true
      });
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();
  
  // カレンダー用の日付生成（今日から30日後まで）
  const generateCalendarDays = () => {
    const days = [];
    const today = startOfDay(new Date());
    
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      days.push(date);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-4">
      {/* 日付選択 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">日付を選択</h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            📅 {format(selectedDate, 'yyyy年MM月dd日', { locale: ja })}
          </button>
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => onDateChange(new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {showCalendar && (
          <div className="mt-3 grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => (
              <button
                key={index}
                onClick={() => {
                  onDateChange(date);
                  setShowCalendar(false);
                }}
                className={`p-2 text-sm rounded-lg transition-colors ${
                  format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {format(date, 'd')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 時間選択 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">時間を選択</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {timeSlots.map((slot) => (
            <button
              key={slot.time}
              onClick={() => onTimeSlotToggle(slot.time)}
              className={`p-3 rounded-lg border transition-colors text-sm ${
                selectedTimeSlots.includes(slot.time)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              }`}
            >
              {slot.time}
            </button>
          ))}
        </div>
      </div>

      {/* 選択状況 */}
      {selectedTimeSlots.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            ✅ {selectedTimeSlots.length}件の予約枠を選択中
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTimeSlots.map((time) => (
              <span
                key={time}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
              >
                {time}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
