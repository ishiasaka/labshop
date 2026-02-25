'use client';
import useSWRMutation from 'swr/mutation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface PaymentCreate {
  student_id: number;
  amount_paid: number;
  idempotency_key?: string;
}

export interface PaymentOut {
  student_id: number;
  amount_paid: number;
  external_transaction_id: string;
  idempotency_key: string;
  id: string;
  status: string;
  created_at: string;
}

export async function postPayment(
  url: string,
  { arg }: { arg: PaymentCreate }
): Promise<PaymentOut> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.detail ?? `Payment failed: ${res.status}`);
  }

  return res.json();
}

export function usePayment() {
  const { trigger, isMutating, error } = useSWRMutation<
    PaymentOut,
    Error,
    string,
    PaymentCreate
  >(`${API_BASE_URL}/payments/`, postPayment);

  return {
    pay: trigger,
    isPaying: isMutating,
    error:
      error instanceof Error ? error.message : error ? String(error) : null,
  };
}
