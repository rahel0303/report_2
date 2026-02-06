import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Halaman publik (tidak perlu login)
const publicPaths = ['/login', '/api/auth/login'];

// Halaman khusus admin
const adminPaths = ['/admin'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get('session');
  const isLoggedIn = !!session;

  // Jika sudah login dan mencoba akses /login, redirect ke home
  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Jika belum login dan bukan halaman publik, redirect ke login
  if (!isLoggedIn && !publicPaths.some((path) => pathname.startsWith(path))) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Untuk halaman admin, cek role dari token (akan dicek di page level)
  // Middleware tidak bisa decode JWT tanpa secret, jadi cek di server component

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
