'use client';

import { Suspense } from 'react';
import { ReviewClient } from './ReviewClient';

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    }>
      <ReviewClient />
    </Suspense>
  );
}
