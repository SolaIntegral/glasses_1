'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'survey' | 'maintenance' | 'general';
  createdAt: Date;
  isRead: boolean;
  url?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // モックデータを生成
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'システムメンテナンスのお知らせ',
        content: '12月25日 2:00-4:00にシステムメンテナンスを実施いたします。',
        type: 'maintenance',
        createdAt: new Date('2024-12-20'),
        isRead: false,
      },
      {
        id: '2',
        title: 'アンケートへのご協力のお願い',
        content: 'サービスの改善のため、アンケートにご協力ください。',
        type: 'survey',
        createdAt: new Date('2024-12-19'),
        isRead: false,
        url: 'https://forms.example.com/survey',
      },
      {
        id: '3',
        title: '新機能の追加について',
        content: '予約システムに新機能が追加されました。',
        type: 'system',
        createdAt: new Date('2024-12-18'),
        isRead: true,
      },
      {
        id: '4',
        title: '年末年始の営業について',
        content: '12月29日〜1月3日は営業をお休みさせていただきます。',
        type: 'general',
        createdAt: new Date('2024-12-15'),
        isRead: true,
      },
    ];

    // 日付順でソート（新しい順）
    mockNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    setNotifications(mockNotifications);
    setLoading(false);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'survey':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        );
      case 'maintenance':
        return (
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.url) {
      window.open(notification.url, '_blank');
    }
    
    // 未読を既読にマーク
    if (!notification.isRead) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id 
            ? { ...n, isRead: true }
            : n
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => window.history.back()} className="p-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">お知らせ</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">お知らせはありません</h2>
            <p className="text-gray-600">新しいお知らせがあると、ここに表示されます。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full bg-white rounded-lg shadow p-4 text-left hover:shadow-lg transition-shadow ${
                  !notification.isRead ? 'ring-2 ring-blue-200' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {getNotificationIcon(notification.type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-base font-semibold truncate ${
                        !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {notification.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {format(notification.createdAt, 'yyyy年M月d日', { locale: ja })}
                      </span>
                      
                      {notification.url && (
                        <span className="text-xs text-blue-600 font-medium">
                          詳細を見る →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
