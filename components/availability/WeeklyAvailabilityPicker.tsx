'use client';

import { useState } from 'react';
import { format, addDays, startOfWeek, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';

interface SelectedSlot {
  date: Date;
  time: string;
}

interface WeeklyAvailabilityPickerProps {
  selectedSlots: SelectedSlot[];
  onSlotsChange: (slots: SelectedSlot[]) => void;
}

export default function WeeklyAvailabilityPicker({
  selectedSlots,
  onSlotsChange
}: WeeklyAvailabilityPickerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 }) // 月曜日から始まる週
  );
  
  // 30分間隔のタイムスロットを生成（09:00〜22:00）
  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 9; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  
  // 週の日付を生成（月〜日）
  const weekDays = Array.from({ length: 7 }, (_, i) => 
    addDays(currentWeekStart, i)
  );

  // 前週/次週に移動
  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };
  
  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  // 現在の週かチェック
  const isCurrentWeek = format(currentWeekStart, 'yyyy-MM-dd') === 
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // 特定の日付・時間が選択されているかチェック
  const isSlotSelected = (date: Date, time: string): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return selectedSlots.some(slot => 
      format(slot.date, 'yyyy-MM-dd') === dateStr && slot.time === time
    );
  };

  // 日付・時間のトグル
  const toggleSlot = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isSelected = isSlotSelected(date, time);
    
    if (isSelected) {
      // 選択解除
      onSlotsChange(
        selectedSlots.filter(
          slot => !(format(slot.date, 'yyyy-MM-dd') === dateStr && slot.time === time)
        )
      );
    } else {
      // 選択追加
      onSlotsChange([...selectedSlots, { date, time }]);
    }
  };

  // その日の選択数を取得
  const getDaySlotCount = (date: Date): number => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return selectedSlots.filter(slot => format(slot.date, 'yyyy-MM-dd') === dateStr).length;
  };

  return (
    <div className="space-y-4">
      {/* 週移動ボタン */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousWeek}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← 前週
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {format(weekDays[0], 'yyyy年MM月dd日', { locale: ja })} 〜 
          {format(weekDays[6], 'MM月dd日', { locale: ja })}
        </h3>
        <button
          onClick={goToNextWeek}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          次週 →
        </button>
      </div>

      {/* 週間カレンダー + 時間選択 */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 gap-1 min-w-[800px]">
          {/* ヘッダー行（時間列 + 日付列） */}
          <div className="text-center text-sm font-medium text-gray-500 p-2">
            時間
          </div>
          {weekDays.map((date) => {
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const slotCount = getDaySlotCount(date);
            
            return (
              <div key={format(date, 'yyyy-MM-dd')} className="text-center">
                <div className={`text-xs font-medium mb-1 p-2 rounded-t-lg ${
                  isToday ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-700'
                }`}>
                  {format(date, 'MM/dd')}
                </div>
                <div className="text-xs text-gray-600">
                  {format(date, 'E', { locale: ja })}
                </div>
                {slotCount > 0 && (
                  <div className="text-xs text-blue-600 font-semibold mt-1">
                    {slotCount}件
                  </div>
                )}
              </div>
            );
          })}
          
          {/* 時間行 */}
          {timeSlots.map((time) => (
            <div key={time} className="contents">
              {/* 時間列 */}
              <div className="text-center text-sm text-gray-600 p-2 border-r border-gray-200">
                {time}
              </div>
              {/* 各日のボタン */}
              {weekDays.map((date) => {
                const isSelected = isSlotSelected(date, time);
                const isPast = startOfDay(date) < startOfDay(new Date());
                
                return (
                  <button
                    key={`${format(date, 'yyyy-MM-dd')}-${time}`}
                    onClick={() => !isPast && toggleSlot(date, time)}
                    disabled={isPast}
                    className={`p-1 text-xs transition-colors border-b border-gray-100 ${
                      isPast
                        ? 'bg-gray-100 cursor-not-allowed opacity-50'
                        : isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white hover:bg-blue-50 border-blue-200'
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

