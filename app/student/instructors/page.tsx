'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllInstructorsWithUsers } from '@/lib/firebase/instructors';
import { InstructorWithUser } from '@/types';
import Loading from '@/components/ui/Loading';

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<InstructorWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const data = await getAllInstructorsWithUsers();
        setInstructors(data);
      } catch (err) {
        console.error('Error fetching instructors:', err);
        setError('講師情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  if (loading) {
    return <Loading />;
  }

  // 検索フィルター
  const filteredInstructors = instructors.filter(instructor =>
    instructor.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instructor.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (instructor.specialties && instructor.specialties.some(specialty => 
      specialty.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/student/dashboard" className="p-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">講師から探す</h1>
            <button className="relative p-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* 検索バー */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="キーワードで検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue- next:border-transparent"
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 絞り込みボタン */}
        <div className="mb-6">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
            絞り込み
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        {filteredInstructors.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">講師が見つかりませんでした。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInstructors.map((instructor) => (
              <Link
                key={instructor.id}
                href={`/student/instructors/detail?id=${instructor.userId}`}
                className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4"
              >
                <div className="flex items-center space-x-4">
                  {/* 講師の顔写真 */}
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {instructor.profileImageUrl ? (
                      <img
                        src={instructor.profileImageUrl}
                        alt={instructor.user.displayName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👨‍🏫</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* 講師名 */}
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {instructor.user.displayName}
                    </h3>
                    
                    {/* 専門分野タグ */}
                    {instructor.specialties && instructor.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {instructor.specialties.slice(0, 3).map((specialty, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                          >
                            {specialty}
                          </span>
                        ))}
                        {instructor.specialties.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{instructor.specialties.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* 簡単なキャッチコピー */}
                    {instructor.bio && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {instructor.bio}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}