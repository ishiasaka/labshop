import { type NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE = process.env.API_URL ?? 'http://localhost:8000';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid request body' }, { status: 400 });
  }

  let r: Response;
  try {
    r = await fetch(`${FASTAPI_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ detail: 'API unreachable' }, { status: 503 });
  }

  const data = await r.json().catch(() => null);

  if (!r.ok) {
    return NextResponse.json(data ?? { detail: 'Invalid credentials' }, { status: r.status });
  }

  const response = NextResponse.json({
    ok: true,
    admin_name: data.full_name as string,
    admin_id: String(data.admin_id),
  });

  const cookieOpts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 6 * 60,
    path: '/',
  };
  response.cookies.set('admin_token', data.token as string, cookieOpts);
  response.cookies.set('admin_name', data.full_name as string, {
    ...cookieOpts,
    httpOnly: false,
  });
  response.cookies.set('admin_id', String(data.admin_id), {
    ...cookieOpts,
    httpOnly: false,
  });

  return response;
}
