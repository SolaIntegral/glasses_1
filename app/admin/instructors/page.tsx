'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface InstructorData {
  uid: string;
  userId: string;
  displayName: string;
  role: string;
  createdAt: Date;
  specialties?: string[];
  slackMemberId?: string;
  isActive?: boolean;
  password?: string; // パスワード表示用
  instructorDocId?: string; // instructorsコレクションのdocument ID
}

export default function InstructorsManagement() {
  const [instructors, setInstructors] = useState<InstructorData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      // Firestoreからすべてのユーザーを取得
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users: InstructorData[] = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // 講師のみフィルタリング
        if (userData.role === 'instructor') {
          // 講師の詳細情報を取得
          const instructorDoc = await getDoc(doc(db, 'instructors', userDoc.id));
          const instructorData = instructorDoc.exists() ? instructorDoc.data() : {};
          
          // パスワードを取得（復号化）
          let password = 'なし';
          if (userData.hashedPassword) {
            try {
              password = Buffer.from(userData.hashedPassword, 'base64').toString('utf-8');
            } catch (e) {
              password = '取得失敗';
            }
          }

          users.push({
            uid: userDoc.id,
            userId: userDoc.id,
            displayName: userData.displayName,
            role: userData.role,
            createdAt: userData.createdAt?.toDate() || new Date(),
            specialties: instructorData?.specialties || [],
            slackMemberId: instructorData?.slackMemberId,
            isActive: instructorData?.isActive ?? true,
            password: password,
            instructorDocId: instructorDoc.id || userDoc.id
          });
        }
      }
      
      setInstructors(users);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    const newStatus = !currentActive;
    const action = newStatus ? '有効化' : '停止';
    
    if (confirm(`この講師を${action}しますか？`)) {
      try {
        // Firestoreのinstructorsコレクションを更新
        const { doc, updateDoc } = await import('firebase/firestore');
        const instructorRef = doc(db, 'instructors', userId);
        await updateDoc(instructorRef, {
          isActive: newStatus,
          updatedAt: new Date()
        });
        
        // 一覧を再取得
        fetchInstructors();
      } catch (error) {
        console.error('Error updating instructor status:', error);
        alert('ステータスの更新に失敗しました');
      }
    }
  };

  const filteredInstructors = instructors.filter(instructor =>
    instructor.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instructor.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">講師管理</h1>
        <Link
          href="/admin/instructors/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          新規講師アカウント発行
        </Link>
      </div>

      {/* 検索バー */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="講師名で検索"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 講師一覧テーブル */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">講師ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">講師名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">パスワード</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">専門分野</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slack連携</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アクション</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInstructors.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  {loading ? '読み込み中...' : '講師が見つかりませんでした'}
                </td>
              </tr>
            ) : (
              filteredInstructors.map((instructor) => (
                <tr key={instructor.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {instructor.userId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {instructor.displayName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                    {instructor.password}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {instructor.specialties && instructor.specialties.length > 0
                      ? instructor.specialties.join(', ')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      instructor.slackMemberId
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {instructor.slackMemberId ? '済' : '未'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      instructor.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {instructor.isActive ? '有効' : '停止中'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      href={`/instructor/profile?admin=true&uid=${instructor.userId}&instructorDocId=${instructor.instructorDocId}`}
                      className="text-blue-600 hover:text-blue-900"
                      prefetch={false}
                    >
                      編集
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(instructor.userId, instructor.isActive ?? true)}
                      className="text-orange-600 hover:text-orange-900"
                    >
                      {instructor.isActive ? '停止' : '有効化'}
                    </button>
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
