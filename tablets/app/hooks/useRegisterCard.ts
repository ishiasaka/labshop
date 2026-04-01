'use client';
import useSWRMutation from 'swr/mutation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface CardCreate {
    uid: string;
    student_id: string;
    first_name: string;
    last_name: string;
}

export interface CardOut {
    uid: string;
    student_id: string;
}



export async function postRegisterCard(
  url: string,
  { arg }: { arg: CardCreate }
): Promise<CardOut> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.detail ?? `Registration failed: ${res.status}`);
  }

  return res.json();
}

export function useRegisterCard() {
  const { trigger, isMutating, error } = useSWRMutation<
    CardOut,
    Error,
    string,
    CardCreate
  >(`${API_BASE_URL}/ic_cards/tablets/register`, postRegisterCard);

  return {
    register: trigger,
    isRegistering: isMutating,
    error:
      error instanceof Error ? error.message : error ? String(error) : null,
  };
}
