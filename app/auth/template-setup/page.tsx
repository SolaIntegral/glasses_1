'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import InitialTemplateSetup from '@/components/availability/InitialTemplateSetup';

function TemplateSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const userIdParam = searchParams.get('userId');
    if (!userIdParam) {
      router.push('/auth/register');
      return;
    }
    setUserId(userIdParam);
  }, [searchParams, router]);

  const handleComplete = () => {
    router.push('/instructor/dashboard');
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return <InitialTemplateSetup userId={userId} onComplete={handleComplete} />;
}

export default function TemplateSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <TemplateSetupContent />
    </Suspense>
  );
}
