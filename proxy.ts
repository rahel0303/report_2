import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth disabled - semua halaman bisa diakses tanpa login
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
