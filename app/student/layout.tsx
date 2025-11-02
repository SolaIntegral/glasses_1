'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.role !== 'student') {
        router.push('/instructor/dashboard');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  if (loading) {
    return <Loading />;
  }

  if (!user || user.role !== 'student') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader />
      <main className="pb-20">{children}</main>
      <MobileNavigation />
    </div>
  );
}

