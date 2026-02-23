'use client';
import useSWR from 'swr';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../locales';

export interface User {
  student_id: number;
  first_name: string;
  last_name: string;
  account_balance: number;
  status: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const REFRESH_INTERVAL_MS = 90_000; // 1.5 minutes

async function fetcher(url: string): Promise<User[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
  const data = await res.json();
  return data.users ?? [];
}

export function useUsers() {
  const { language } = useLanguage();
  const t = translations[language];

  const { data, error, isLoading } = useSWR<User[]>(
    `${API_BASE_URL}/users/`,
    fetcher,
    { refreshInterval: REFRESH_INTERVAL_MS }
  );

  return {
    users: data ?? [],
    loading: isLoading,
    error: error ? t.users.fetchError : null,
  };
}
