'use client';

import { useState, useEffect } from 'react';
import { 
  defaultTemplates, 
  getUserAvailabilitySettings, 
  saveUserAvailabilitySettings,
  getDefaultSettings,
  UserAvailabilitySettings,
  AvailabilityTemplate 
} from '@/lib/templates/availabilityTemplates';

interface TemplateManagerProps {
  userId: string;
}

export default function TemplateManager({ userId }: TemplateManagerProps) {
  const [settings, setSettings] = useState<UserAvailabilitySettings | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = () => {
    const userSettings = getUserAvailabilitySettings(userId);
    if (userSettings) {
      setSettings(userSettings);
      setSelectedTemplates(userSettings.preferredTemplates);
    } else {
      const defaultSettings = getDefaultSettings(userId);
      setSettings(defaultSettings);
      setSelectedTemplates(defaultSettings.preferredTemplates);
    }
  };

  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const newSettings: UserAvailabilitySettings = {
        userId,
        preferredTemplates: selectedTemplates,
        customTemplates: settings?.customTemplates || [],
        workSchedule: settings?.workSchedule || {
          workDays: [1, 2, 3, 4, 5],
          workStartTime: '09:00',
          workEndTime: '18:00'
        }
      };
      
      saveUserAvailabilitySettings(newSettings);
      setSettings(newSettings);
      alert('設定を保存しました');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('設定の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('設定をデフォルトに戻しますか？')) {
      const defaultSettings = getDefaultSettings(userId);
      setSelectedTemplates(defaultSettings.preferredTemplates);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">予約枠テンプレート設定</h3>
      
      <div className="space-y-6">
        {/* テンプレート選択 */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">お気に入りの時間帯</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {defaultTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateToggle(template.id)}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedTemplates.includes(template.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{template.icon}</span>
                  <div>
                    <h5 className="font-semibold text-gray-900">{template.name}</h5>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 説明 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            📝 選択したテンプレートは、予約枠作成時にクイック作成ボタンとして表示されます。<br />
            ⏰ 各予約枠は30分の単発予約として作成されます。
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            リセット
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
