'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createNotification } from '@/lib/firebase/notifications';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Student {
  userId: string;
  displayName: string;
}

export default function NewNotification() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [target, setTarget] = useState('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [sendImmediately, setSendImmediately] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 生徒一覧を取得
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const querySnapshot = await getDocs(q);
        const studentsList: Student[] = querySnapshot.docs.map(doc => ({
          userId: doc.id,
          displayName: doc.data().displayName || doc.id,
        }));
        // 表示名でソート
        studentsList.sort((a, b) => a.displayName.localeCompare(b.displayName, 'ja'));
        setStudents(studentsList);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('生徒一覧の取得に失敗しました');
      } finally {
        setLoadingStudents(false);
      }
    };

    if (target === 'specific') {
      fetchStudents();
    }
  }, [target]);

  const getAllStudentIds = async (): Promise<string[]> => {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.id);
  };

  // チェックボックスの切り替え
  const handleStudentToggle = (userId: string) => {
    const newSelected = new Set(selectedStudentIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedStudentIds(newSelected);
  };

  // 全選択/全解除
  const handleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map(s => s.userId)));
    }
  };

  // 検索でフィルタリング
  const filteredStudents = students.filter(student =>
    student.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm('このお知らせを配信しますか？')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      let targetUserIds: string[] = [];

      if (target === 'all') {
        // 全生徒に配信
        targetUserIds = await getAllStudentIds();
      } else if (target === 'specific') {
        // 選択された生徒に配信
        if (selectedStudentIds.size === 0) {
          setError('配信対象の生徒を選択してください');
          setLoading(false);
          return;
        }
        targetUserIds = Array.from(selectedStudentIds);
      }

      // 通知メッセージを作成（URLがある場合は含める）
      const message = url 
        ? `${content}\n\nリンク: ${url}`
        : content;

      console.log('Creating notifications for students:', targetUserIds);
      console.log('Title:', title);
      console.log('Message:', message);
      console.log('URL:', url);

      // 各生徒に通知を作成（エラーが発生しても続行）
      const notificationResults = await Promise.allSettled(
        targetUserIds.map(userId =>
          createNotification(userId, title, message, 'system', undefined, url || undefined)
        )
      );

      // 成功と失敗をカウント
      const successful = notificationResults.filter(r => r.status === 'fulfilled').length;
      const failed = notificationResults.filter(r => r.status === 'rejected').length;

      // 失敗した通知のエラーをログに記録
      notificationResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to create notification for user ${targetUserIds[index]}:`, result.reason);
        }
      });

      if (failed > 0) {
        alert(`${successful}名の生徒にお知らせを配信しました。${failed}名の配信に失敗しました。`);
      } else {
        alert(`${successful}名の生徒にお知らせを配信しました`);
      }

      router.push('/admin/notifications');
    } catch (err: any) {
      console.error('Error sending notifications:', err);
      setError(err.message || 'お知らせの配信に失敗しました');
    } finally {
      setLoading(false);
    }
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

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
                <option value="specific">特定の生徒を選択</option>
              </select>
            </div>

            {target === 'specific' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  配信対象の生徒を選択 <span className="text-red-500">*</span>
                </label>
                
                {/* 検索バー */}
                <div className="mb-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="生徒名またはIDで検索..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 全選択/全解除ボタン */}
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0
                      ? 'すべて解除'
                      : 'すべて選択'}
                  </button>
                  <span className="text-sm text-gray-500 ml-2">
                    {selectedStudentIds.size}名選択中
                  </span>
                </div>

                {/* 生徒リスト */}
                {loadingStudents ? (
                  <div className="text-center py-8 text-gray-500">
                    読み込み中...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? '検索結果が見つかりませんでした' : '生徒が見つかりませんでした'}
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                    <div className="divide-y divide-gray-200">
                      {filteredStudents.map((student) => (
                        <label
                          key={student.userId}
                          className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.has(student.userId)}
                            onChange={() => handleStudentToggle(student.userId)}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {student.displayName}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {student.userId}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
