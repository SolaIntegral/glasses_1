'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewNotification() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [target, setTarget] = useState('all');
  const [sendImmediately, setSendImmediately] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm('このお知らせを配信しますか？')) {
      return;
    }

    // お知らせをlocalStorageに保存（実装例）
    const notification = {
      id: `notification-${Date.now()}`,
      title,
      content,
      url,
      target,
      type: 'general',
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    // 既存のお知らせを取得
    const existingNotifications = localStorage.getItem('mock_notifications');
    const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
    notifications.push(notification);
    localStorage.setItem('mock_notifications', JSON.stringify(notifications));

    alert('お知らせを配信しました');
    router.push('/admin/notifications');
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/notifications" className="text-blue-600 hover:text-blue-700 flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            お知らせ一覧に戻る
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">新規お知らせ作成</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                配信対象 <span className="text-red-500">*</span>
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全生徒</option>
                <option value="specific">特定の生徒IDを指定</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="システムメンテナンスのお知らせ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                本文 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="お知らせの本文を入力してください"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                リンク先URL（任意）
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/survey"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sendImmediately}
                  onChange={(e) => setSendImmediately(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">すぐに配信する</span>
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '配信中...' : '配信内容を確認する'}
              </button>
              <Link
                href="/admin/notifications"
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold text-center hover:bg-gray-400 transition-colors"
              >
                キャンセル
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
