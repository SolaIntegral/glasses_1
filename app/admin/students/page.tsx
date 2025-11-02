'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface StudentData {
  userId: string;
  displayName: string;
  role: string;
  createdAt: Date;
  password?: string; // パスワード表示用
}

export default function StudentsManagement() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const snapshot = await getDocs(usersCollection);
      const users: StudentData[] = [];
      
      snapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.role === 'student') {
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
            userId: doc.id,
            displayName: userData.displayName,
            role: userData.role,
            createdAt: userData.createdAt?.toDate() || new Date(),
            password: password
          });
        }
      });
      
      setStudents(users);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (confirm('このユーザーのパスワードをリセットしますか？')) {
      const newPassword = `student${Math.floor(Math.random() * 10000)}`;
      const hashedPassword = Buffer.from(newPassword).toString('base64');
      
      try {
        await setDoc(doc(db, 'users', userId), {
          hashedPassword,
          updatedAt: new Date(),
        }, { merge: true });
        alert(`新しいパスワード: ${newPassword}\nこのパスワードを生徒に伝えてください。`);
      } catch (error) {
        alert('パスワードのリセットに失敗しました。');
      }
    }
  };

  const handleDelete = async (userId: string) => {
    if (confirm('このユーザーを削除しますか？この操作は取り消せません。')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        fetchStudents();
      } catch (error) {
        alert('ユーザーの削除に失敗しました。');
      }
    }
  };

  const filteredStudents = students.filter(student =>
    student.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">生徒管理</h1>
        <Link
          href="/admin/students/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          新規生徒アカウント発行
        </Link>
      </div>

      {/* 検索バー */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="生徒IDまたは氏名で検索"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 生徒一覧テーブル */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                生徒ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                氏名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                パスワード
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                登録日
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                アクション
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  生徒が見つかりませんでした
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.userId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.displayName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                    {student.password}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(student.createdAt).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleResetPassword(student.userId)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      パスワードリセット
                    </button>
                    <button
                      onClick={() => handleDelete(student.userId)}
                      className="text-red-600 hover:text-red-900"
                    >
                      削除
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
