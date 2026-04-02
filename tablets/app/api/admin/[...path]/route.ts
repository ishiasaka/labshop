import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const FASTAPI_BASE = process.env.API_URL ?? 'http://localhost:8000';

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  }

  const { path } = await params;
  const targetPath = '/' + path.join('/');
  const url = `${FASTAPI_BASE}${targetPath}${req.nextUrl.search}`;

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = { method: req.method, headers };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const bodyText = await req.text();
    if (bodyText) options.body = bodyText;
  }

  let r: Response;
  try {
    r = await fetch(url, options);
  } catch {
    return NextResponse.json({ detail: 'API unreachable' }, { status: 503 });
  }

  const contentType = r.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  }

  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { 'Content-Type': contentType || 'text/plain' },
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
