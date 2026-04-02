import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    admin_name: cookieStore.get('admin_name')?.value ?? '',
    admin_id: cookieStore.get('admin_id')?.value ?? '',
  });
}
