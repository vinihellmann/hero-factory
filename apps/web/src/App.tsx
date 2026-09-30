import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';

import { HeroesPage } from '@/features/heroes/HeroesPage';
import { appTheme } from '@/theme';

export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <HeroesPage />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
