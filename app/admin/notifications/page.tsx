'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function NotificationsManagement() {
  const [notifications, setNotifications] = useState<any[]>([]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">お知らせ配信</h1>
        <Link
          href="/admin/notifications/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          新規お知らせ作成
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">配信日時</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイトル</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">対象</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アクション</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                配信したお知らせはありません
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
