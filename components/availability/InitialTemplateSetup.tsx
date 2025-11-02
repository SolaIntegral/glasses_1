'use client';

import { useState } from 'react';
import { defaultTemplates, saveUserAvailabilitySettings, getDefaultSettings, UserAvailabilitySettings, getRecommendedTemplates } from '@/lib/templates/availabilityTemplates';

interface InitialTemplateSetupProps {
  userId: string;
  onComplete: () => void;
}

export default function InitialTemplateSetup({ userId, onComplete }: InitialTemplateSetupProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(['early-morning', 'lunch-time', 'after-work']);
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('18:00');

  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleWorkDayToggle = (dayValue: number) => {
    setWorkDays(prev => 
      prev.includes(dayValue) 
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  const handleSave = () => {
    const settings: UserAvailabilitySettings = {
      userId,
      preferredTemplates: selectedTemplates,
      customTemplates: [],
      workSchedule: {
        workDays,
        workStartTime,
        workEndTime
      }
    };
    
    saveUserAvailabilitySettings(settings);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">予約枠の設定</h1>
          <p className="text-gray-600">
            よく使う予約枠のパターンを選択してください。<br />
            後からいつでも変更できます。
          </p>
        </div>

        {/* 勤務時間設定 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">勤務時間設定</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">出勤時間</label>
              <input
                type="time"
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">退勤時間</label>
              <input
                type="time"
                value={workEndTime}
                onChange={(e) => setWorkEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">勤務日</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 0, label: '日' },
                { value: 1, label: '月' },
                { value: 2, label: '火' },
                { value: 3, label: '水' },
                { value: 4, label: '木' },
                { value: 5, label: '金' },
                { value: 6, label: '土' }
              ].map((day) => (
                <button
                  key={day.value}
                  onClick={() => handleWorkDayToggle(day.value)}
                  className={`px-3 py-1 rounded-lg border transition-colors ${
                    workDays.includes(day.value)
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">おすすめの時間帯</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {defaultTemplates.filter(t => t.isPopular).map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateToggle(template.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedTemplates.includes(template.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


        <div className="flex justify-center">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            設定を保存
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              const defaultSettings = getDefaultSettings(userId);
              saveUserAvailabilitySettings(defaultSettings);
              onComplete();
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            後で設定する（デフォルト設定を使用）
          </button>
        </div>
      </div>
    </div>
  );
}
