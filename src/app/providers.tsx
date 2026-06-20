'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';

function SpaRedirectHandler() {
  const router = useRouter();
  useEffect(() => {
    const redirect = sessionStorage.getItem('__spa_redirect');
    if (redirect && redirect !== '/') {
      sessionStorage.removeItem('__spa_redirect');
      router.replace(redirect);
    }
  }, [router]);
  return null;
}

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SpaRedirectHandler />
      {children}
      <Toaster
        position="top-right"
        richColors
        toastOptions={{ duration: 4000 }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
