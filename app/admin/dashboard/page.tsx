'use client';

import { useEffect, useState } from 'react';
import { getAllBookings } from '@/lib/firebase/bookings';
import { Booking } from '@/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalInstructors, setTotalInstructors] = useState(0);
  const [loading, setLoading] = useState(true);

  console.log('AdminDashboard render - loading:', loading);

  useEffect(() => {
    console.log('AdminDashboard useEffect called');
    const fetchData = async () => {
      try {
        console.log('Fetching admin dashboard data...');
        // すべてのユーザーを取得
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => doc.data());

        const students = users.filter(u => u.role === 'student');
        const instructors = users.filter(u => u.role === 'instructor');

        setTotalStudents(students.length);
        setTotalInstructors(instructors.length);

        // すべての予約を取得
        const allBookings = await getAllBookings();
        setBookings(allBookings);
        console.log('Admin dashboard data fetched successfully');
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const today = new Date();
  const todayBookings = bookings.filter(booking => {
    const startTime = booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime);
    return (
      startTime.getDate() === today.getDate() &&
      startTime.getMonth() === today.getMonth() &&
      startTime.getFullYear() === today.getFullYear() &&
      booking.status === 'confirmed'
    );
  });

  console.log('AdminDashboard rendering content - loading:', loading, 'bookings:', bookings.length);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">ダッシュボード</h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">本日の予約数</p>
              <p className="text-3xl font-semibold text-gray-900">{todayBookings.length}件</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">総生徒数</p>
              <p className="text-3xl font-semibold text-gray-900">{totalStudents}人</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">総講師数</p>
              <p className="text-3xl font-semibold text-gray-900">{totalInstructors}人</p>
            </div>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">予約統計</h2>
        <p className="text-gray-600">総予約数: {bookings.length}件</p>
        <p className="text-gray-600 mt-2">確定済み: {bookings.filter(b => b.status === 'confirmed').length}件</p>
        <p className="text-gray-600 mt-2">キャンセル済み: {bookings.filter(b => b.status === 'cancelled').length}件</p>
      </div>
    </div>
  );
}
