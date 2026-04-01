import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('admin_token');
  response.cookies.delete('admin_name');
  response.cookies.delete('admin_id');
  return response;
}
