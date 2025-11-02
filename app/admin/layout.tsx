'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/ui/AdminSidebar';
import Loading from '@/components/ui/Loading';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  console.log('AdminLayout render - loading:', loading, 'user:', user?.role);

  useEffect(() => {
    console.log('AdminLayout useEffect - loading:', loading, 'user:', user?.role);
    if (!loading) {
      if (!user) {
        console.log('Admin layout: No user, redirecting to login');
        router.push('/auth/login');
      } else if (user.role !== 'admin') {
        // 管理者以外はアクセス不可
        console.log('Admin layout: User is not admin, role:', user.role);
        router.push('/auth/login');
      } else {
        console.log('Admin layout: User is admin, access granted');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  console.log('AdminLayout before render check - loading:', loading, 'user:', user?.role);

  if (loading) {
    console.log('AdminLayout: loading is true, showing Loading');
    return <Loading />;
  }

  if (!user || user.role !== 'admin') {
    console.log('AdminLayout: not admin or no user, returning null');
    return null;
  }

  console.log('AdminLayout: rendering admin dashboard');

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
