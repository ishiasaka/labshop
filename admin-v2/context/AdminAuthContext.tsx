'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AdminInfo } from '../app/types';

interface AdminAuthContextValue {
  adminInfo: AdminInfo | null;
  setAdminInfo: (info: AdminInfo | null) => void;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);

  const logout = useCallback(async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAdminInfo(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ adminInfo, setAdminInfo, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
