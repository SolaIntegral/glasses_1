'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getBookingsByStudent } from '@/lib/firebase/bookings';
import { Booking, InstructorWithUser } from '@/types';
import { getInstructorWithUser } from '@/lib/firebase/instructors';
import Loading from '@/components/ui/Loading';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { resolveMeetingUrl } from '@/lib/utils/meeting';

interface BookingWithInstructor extends Booking {
  instructor?: InstructorWithUser;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithInstructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        const bookings = await getBookingsByStudent(user.uid);
        // 今後の予約のみを取得
        const now = new Date();
        const upcoming = bookings.filter(booking => {
          const startTime = booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime);
          return startTime > now && booking.status === 'confirmed';
        });
        
        // 開始時間順でソート
        upcoming.sort((a, b) => {
          const timeA = a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
          const timeB = b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
          return timeA.getTime() - timeB.getTime();
        });

        // 講師情報を取得
        const bookingsWithInstructors: BookingWithInstructor[] = await Promise.all(
          upcoming.slice(0, 1).map(async (booking) => {
            try {
              const instructor = await getInstructorWithUser(booking.instructorId);
              return { ...booking, instructor: instructor || undefined };
            } catch {
              return { ...booking, instructor: undefined };
            }
          })
        );

        setUpcomingBookings(bookingsWithInstructors);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  if (authLoading || loading) {
    return <Loading />;
  }

  const nextBooking = upcomingBookings[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* 次の予約カード */}
        {nextBooking && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">次の予約</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-700">
                  {format(
                    nextBooking.startTime instanceof Date ? nextBooking.startTime : new Date(nextBooking.startTime),
                    'M月d日 HH:mm〜',
                    { locale: ja }
                  )}
                </span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-gray-700">講師名: {nextBooking.instructor?.user.displayName} 講師</span>
              </div>
              {nextBooking.meetingUrl && (
                <a
                  href={resolveMeetingUrl(nextBooking.meetingUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
                >
                  MTGに参加する
                </a>
              )}
            </div>
          </div>
        )}

        {/* メインボタン */}
        <div className="space-y-4">
          {/* 講師から探す */}
          <Link
            href="/student/instructors"
            className="block w-full bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">講師から探す</h3>
                <p className="text-sm text-gray-600">講師を選んで予約する</p>
              </div>
            </div>
          </Link>

          {/* 日時から探す */}
          <Link
            href="/student/date-search"
            className="block w-full bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">日時から探す</h3>
                <p className="text-sm text-gray-600">日付を選んで予約する</p>
              </div>
            </div>
          </Link>

          {/* プロフィール編集 */}
          <Link
            href="/student/profile"
            className="block w-full bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">プロフィール編集</h3>
                <p className="text-sm text-gray-600">プロフィール情報を編集する</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
