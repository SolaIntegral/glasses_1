'use client';

import { useEffect, useState } from 'react';
import { getAllBookings, forceCancelBooking } from '@/lib/firebase/bookings';
import { Booking } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { resolveMeetingUrl } from '@/lib/utils/meeting';

export default function BookingsMonitoring() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchAllBookings();
  }, []);

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status === filterStatus));
    }
  }, [filterStatus, bookings]);

  const fetchAllBookings = async () => {
    try {
      // すべての予約を取得
      const allBookings = await getAllBookings();
      setBookings(allBookings);
      setFilteredBookings(allBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceCancel = async (booking: Booking) => {
    if (!confirm('この予約を強制的にキャンセルしますか？\n生徒と講師に通知が飛びます')) {
      return;
    }

    try {
      // 管理者はforceCancelBookingを使用してキャンセル（24時間制限なし）
      await forceCancelBooking(booking.id);
      alert('予約をキャンセルしました');
      fetchAllBookings();
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      alert(error.message || 'キャンセルに失敗しました');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">予約監視</h1>

      {/* フィルター */}
      <div className="mb-6 flex space-x-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">すべて</option>
          <option value="confirmed">確定済み</option>
          <option value="cancelled">キャンセル済み</option>
        </select>
      </div>

      {/* 予約一覧テーブル */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">予約ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">予約日時</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">講師ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">生徒ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MTG URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アクション</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  予約が見つかりませんでした
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => {
                const startTime = booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime);
                
                return (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {booking.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(startTime, 'yyyy/MM/dd HH:mm', { locale: ja })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.instructorId.slice(0, 12)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.studentId.slice(0, 12)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600">
                      {booking.meetingUrl ? (
                        <a
                          href={resolveMeetingUrl(booking.meetingUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          リンク
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status === 'confirmed' ? '確定' : 'キャンセル済'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleForceCancel(booking)}
                          className="text-red-600 hover:text-red-900"
                        >
                          強制キャンセル
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 統計情報 */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">総予約数</div>
          <div className="text-2xl font-bold text-gray-900">{bookings.length}件</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">確定済み</div>
          <div className="text-2xl font-bold text-green-600">
            {bookings.filter(b => b.status === 'confirmed').length}件
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">キャンセル済み</div>
          <div className="text-2xl font-bold text-red-600">
            {bookings.filter(b => b.status === 'cancelled').length}件
          </div>
        </div>
      </div>
    </div>
  );
}
