'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createAvailableSlot } from '@/lib/firebase/availability';
import { format, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import WeeklyAvailabilityPicker from '@/components/availability/WeeklyAvailabilityPicker';

interface SelectedSlot {
  date: Date;
  time: string;
}

export default function AddAvailabilityPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateSlots = async () => {
    if (!user) {
      setError('ユーザー情報が取得できません');
      return;
    }

    if (selectedSlots.length === 0) {
      setError('作成する枠がありません。時間を選択してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const minDate = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25時間後
      
      // 各スロットを作成
      for (const slot of selectedSlots) {
        const slotDate = startOfDay(slot.date);
        
        if (slotDate < startOfDay(minDate)) {
          setError('予約枠は24時間以上先の日付に設定してください');
          setLoading(false);
          return;
        }

        const [hour, minute] = slot.time.split(':').map(Number);
        const endTime = new Date(slot.date);
        endTime.setHours(hour, minute + 30, 0, 0);
        
        const startDateTime = new Date(slot.date);
        startDateTime.setHours(hour, minute, 0, 0);
        
        await createAvailableSlot(
          user.uid,
          startDateTime,
          endTime
        );
      }
      
      // 成功したらスケジュール設定画面に戻る
      router.push('/instructor/availability');
    } catch (err: any) {
      console.error('Error creating slots:', err);
      setError(err.message || '予約枠の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="container mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
          <h2 className="text-2xl font-bold text-gray-900">予約枠を登録</h2>
          <p className="text-sm text-gray-600 mt-2">
            週間カレンダーから複数の日時を選択して一括登録できます
          </p>
        </div>

        {/* 週間カレンダー */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <WeeklyAvailabilityPicker
            selectedSlots={selectedSlots}
            onSlotsChange={setSelectedSlots}
          />
        </div>

        {/* 選択中のスロット一覧 */}
        {selectedSlots.length > 0 && (
          <div className="bg-blue-50 rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-900">
                ✅ {selectedSlots.length}件の予約枠を選択中
              </p>
              <button
                onClick={() => setSelectedSlots([])}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                すべて解除
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {selectedSlots
                .sort((a, b) => {
                  const dateDiff = a.date.getTime() - b.date.getTime();
                  if (dateDiff !== 0) return dateDiff;
                  return a.time.localeCompare(b.time);
                })
                .map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white px-2 py-1 rounded text-xs"
                  >
                    <span className="text-gray-700">
                      {format(slot.date, 'MM月dd日', { locale: ja })} {slot.time}
                    </span>
                    <button
                      onClick={() => setSelectedSlots(selectedSlots.filter((s, i) => i !== index))}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        {/* 作成ボタン（固定） */}
        <div className="fixed left-0 right-0 bottom-20 bg-white border-t border-gray-200 p-4 shadow-lg z-[60]">
          <button
            onClick={handleCreateSlots}
            disabled={loading || selectedSlots.length === 0}
            className="w-full bg-blue-600 text-white py-4 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                作成中...
              </div>
            ) : (
              `選択した ${selectedSlots.length}件の予約枠を作成する`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
