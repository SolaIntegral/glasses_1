'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/ui/AdminSidebar';
import Loading from '@/components/ui/Loading';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  usePerformanceMonitor('admin-layout');

  useEffect(() => {
    // ローディング中は何もしない
    if (loading) {
      return;
    }

    // 既にログインページにいる場合は何もしない
    if (pathname === '/auth/login') {
      return;
    }

    // ユーザーがログインしていない、または管理者でない場合はログインページにリダイレクト
    if (!user) {
      const hasSession = typeof window !== 'undefined' ? localStorage.getItem('sessionId') : null;
      if (hasSession) {
        return;
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'pendingRedirect',
          JSON.stringify({ role: 'admin', timestamp: Date.now(), reason: 'no-session' })
        );
      }
      router.replace('/auth/login');
      return;
    }

    if (user.role !== 'admin') {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'pendingRedirect',
          JSON.stringify({ role: 'admin', timestamp: Date.now(), reason: 'wrong-role' })
        );
      }
      router.replace('/auth/login');
      return;
    }
  }, [user, loading, router, pathname]);

  // ローディング中はローディング画面を表示
  if (loading) {
    return <Loading />;
  }

  // ユーザーがログインしていない、または管理者でない場合はローディング画面を表示
  // （リダイレクトが完了するまで）
  if (!user) {
    return <Loading />;
  }

  if (user.role !== 'admin') {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
