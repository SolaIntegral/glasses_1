'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import MobileHeader from '@/components/ui/MobileHeader';
import MobileNavigation from '@/components/ui/MobileNavigation';
import Loading from '@/components/ui/Loading';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  usePerformanceMonitor('instructor-layout');

  useEffect(() => {
    // ローディング中は何もしない
    if (loading) {
      return;
    }

    // 既にログインページにいる場合は何もしない
    if (pathname === '/auth/login') {
      return;
    }

    if (!user) {
      const hasSession = typeof window !== 'undefined' ? localStorage.getItem('sessionId') : null;
      if (hasSession) {
        // セッションは存在するがユーザー情報の取得が完了していない場合は待機
        return;
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'pendingRedirect',
          JSON.stringify({ role: 'instructor', timestamp: Date.now() })
        );
      }
      router.replace('/auth/login');
      return;
    }

    if (user.role !== 'instructor') {
      // ロールに応じて適切なダッシュボードにリダイレクト
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'pendingRedirect',
          JSON.stringify({ role: 'instructor', timestamp: Date.now(), reason: 'wrong-role' })
        );
      }
      if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (user.role === 'student') {
        router.replace('/student/dashboard');
      } else {
        router.replace('/auth/login');
      }
      return;
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Loading />;
  }

  if (user.role !== 'instructor') {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader />
      <main className="pb-20">{children}</main>
      <MobileNavigation />
    </div>
  );
}

