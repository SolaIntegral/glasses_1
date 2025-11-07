'use client';

import { Suspense } from 'react';
import InstructorProfilePage from '@/app/instructor/profile/page';
import Loading from '@/components/ui/Loading';

export default function AdminInstructorEditPage() {
  return (
    <Suspense fallback={<Loading />}>
      <InstructorProfilePage />
    </Suspense>
  );
}


