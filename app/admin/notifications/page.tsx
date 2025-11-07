'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getSystemNotificationGroups, NotificationGroup } from '@/lib/firebase/notifications';
import Loading from '@/components/ui/Loading';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function NotificationsManagement() {
  const [notificationGroups, setNotificationGroups] = useState<NotificationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const groups = await getSystemNotificationGroups();
        
        // 各グループに対して、対象の生徒数を取得
        const groupsWithStudentCount = await Promise.all(
          groups.map(async (group) => {
            // 対象の生徒数を取得
            const studentCount = group.targetUserIds.length;
            
            // 全生徒数を取得
            const allStudentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
            const allStudentsSnapshot = await getDocs(allStudentsQuery);
            const totalStudentCount = allStudentsSnapshot.size;
            
            return {
              ...group,
              studentCount,
              totalStudentCount,
              isAllStudents: studentCount === totalStudentCount,
            };
          })
        );
        
        setNotificationGroups(groupsWithStudentCount);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('お知らせの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <Loading />
      </div>
    );
  }

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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

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
            {notificationGroups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  配信したお知らせはありません
                </td>
              </tr>
            ) : (
              notificationGroups.map((group, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(group.createdAt, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{group.title}</div>
                    <div className="text-gray-500 text-xs mt-1 line-clamp-2">{group.message}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {group.isAllStudents ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        全生徒 ({group.studentCount || group.targetCount}名)
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        特定の生徒 ({group.studentCount || group.targetCount}名)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {group.linkUrl && (
                      <a
                        href={group.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        リンクを開く
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
