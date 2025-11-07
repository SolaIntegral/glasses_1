'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import MobileHeader from '@/components/ui/MobileHeader';
import MobileNavigation from '@/components/ui/MobileNavigation';
import Loading from '@/components/ui/Loading';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
      router.replace('/auth/login');
      return;
    }

    if (user.role !== 'student') {
      // ロールに応じて適切なダッシュボードにリダイレクト
      if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (user.role === 'instructor') {
        router.replace('/instructor/dashboard');
      } else {
        router.replace('/auth/login');
      }
      return;
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'student') {
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

