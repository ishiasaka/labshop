'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setAdminInfo } = useAdminAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === '/login') {
      setChecking(false);
      return;
    }

    fetch('/api/admin/me')
      .then(async (res) => {
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const data = (await res.json()) as { admin_name: string; admin_id: string };
        setAdminInfo({ admin_name: data.admin_name, admin_id: data.admin_id });
      })
      .catch(() => router.replace('/login'))
      .finally(() => setChecking(false));
  }, [pathname, router, setAdminInfo]);

  if (checking && pathname !== '/login') {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
