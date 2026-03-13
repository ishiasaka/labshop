export async function adminFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
}

export async function adminJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await adminFetch(path, options);
  const data = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
  if (!res.ok) {
    const message: string =
      typeof data?.detail === 'string'
        ? data.detail
        : Array.isArray(data?.detail)
          ? (data.detail as { msg?: string; message?: string }[])
              .map((d) => d?.msg ?? d?.message ?? JSON.stringify(d))
              .join('\n')
          : `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

/** SWR-compatible fetcher for admin API routes */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const adminSwrFetcher = (path: string): Promise<any> => adminJson<any>(path);
