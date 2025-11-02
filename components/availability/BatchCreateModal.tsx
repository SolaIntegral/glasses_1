'use client';

import { useState } from 'react';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { defaultTemplates, AvailabilityTemplate } from '@/lib/templates/availabilityTemplates';

interface BatchCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: BatchCreateData) => void;
}

export interface BatchCreateData {
  startDate: Date;
  endDate: Date;
  daysOfWeek: number[];
  timeRange: {
    start: string;
    end: string;
  };
  breakDuration: number;
  template: AvailabilityTemplate | null;
}

const daysOfWeek = [
  { value: 0, label: '日', name: 'sunday' },
  { value: 1, label: '月', name: 'monday' },
  { value: 2, label: '火', name: 'tuesday' },
  { value: 3, label: '水', name: 'wednesday' },
  { value: 4, label: '木', name: 'thursday' },
  { value: 5, label: '金', name: 'friday' },
  { value: 6, label: '土', name: 'saturday' },
];

export default function BatchCreateModal({ isOpen, onClose, onConfirm }: BatchCreateModalProps) {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 7));
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // 月〜金
  const [selectedTemplate, setSelectedTemplate] = useState<AvailabilityTemplate | null>(null);
  const [timeRange, setTimeRange] = useState({ start: '09:00', end: '17:00' });

  const handleDayToggle = (dayValue: number) => {
    setSelectedDays(prev => 
      prev.includes(dayValue) 
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  const handleTemplateSelect = (template: AvailabilityTemplate) => {
    setSelectedTemplate(template);
    setTimeRange({
      start: template.startTime,
      end: template.endTime
    });
  };

  const handleConfirm = () => {
    if (selectedDays.length === 0) {
      alert('曜日を選択してください');
      return;
    }

    if (startDate >= endDate) {
      alert('終了日は開始日より後に設定してください');
      return;
    }

    const data: BatchCreateData = {
      startDate,
      endDate,
      daysOfWeek: selectedDays,
      timeRange,
      breakDuration: 0,
      template: selectedTemplate
    };

    onConfirm(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">期間一括作成</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* 期間設定 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">期間設定</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">開始日</label>
                <input
                  type="date"
                  value={format(startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">終了日</label>
                <input
                  type="date"
                  value={format(endDate, 'yyyy-MM-dd')}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 曜日選択 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">曜日選択</h3>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  onClick={() => handleDayToggle(day.value)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    selectedDays.includes(day.value)
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* テンプレート選択 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">時間帯テンプレート</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {defaultTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-3 border rounded-lg transition-colors text-left ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{template.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 時間設定 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">時間設定</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">開始時間</label>
                <input
                  type="time"
                  value={timeRange.start}
                  onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">終了時間</label>
                <input
                  type="time"
                  value={timeRange.end}
                  onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* プレビュー */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">作成予定</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-800">
                <p>📅 {format(startDate, 'M月d日', { locale: ja })} 〜 {format(endDate, 'M月d日', { locale: ja })}</p>
                <p>📆 {selectedDays.map(day => daysOfWeek.find(d => d.value === day)?.label).join('、')}曜日</p>
                <p>⏰ {timeRange.start} 〜 {timeRange.end}</p>
                <p className="font-medium mt-2">
                  ⚡ 30分間隔で単発予約枠を作成します
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            一括作成
          </button>
        </div>
      </div>
    </div>
  );
}
