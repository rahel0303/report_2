import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'report-app-jwt-secret-2025'
);

const PUBLIC_API_PATHS = ['/api/auth/login', '/api/auth/logout', '/api/auth/me', '/api/auth/register'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth API selalu lolos
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;

  // Verifikasi token
  let payload: { role?: string; is_verified?: boolean } | null = null;
  if (token) {
    try {
      const { payload: p } = await jwtVerify(token, SECRET);
      payload = p as { role?: string; is_verified?: boolean };
    } catch {
      // Token invalid/expired — hapus cookie
      if (pathname === '/login') return NextResponse.next();
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      const res = NextResponse.redirect(new URL('/login', req.url));
      res.cookies.delete('token');
      return res;
    }
  }

  const isLoggedIn = payload !== null;

  // Belum login → hanya boleh /login
  if (!isLoggedIn) {
    if (pathname === '/login') return NextResponse.next();
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Sudah login + akses /login → ke /admin (admin) atau /home (user)
  if (pathname === '/login') {
    return NextResponse.redirect(new URL(payload.role === 'admin' ? '/admin' : '/home', req.url));
  }

  // Admin tidak bisa akses /home atau /
  if (payload.role === 'admin' && (pathname === '/home' || pathname === '/')) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // Unverified user tidak bisa akses report generator (/)
  if (pathname === '/' && payload.is_verified === false) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  // Admin protection: /admin/* dan /api/admin/*
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (isAdminPath && payload.role !== 'admin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/home', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.ico$).*)'],
};
