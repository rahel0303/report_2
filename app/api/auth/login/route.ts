import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/app/lib/db';
import { signToken } from '@/app/lib/auth';

interface User {
  id: number;
  name: string;
  username: string;
  password: string;
  role: string;
  is_verified: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const username = email; // form pakai field 'email', kita treat sebagai username

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password required' }, { status: 400 });
    }

    const users = await query<User>(
      'SELECT * FROM public.users WHERE username = $1 LIMIT 1',
      [username]
    );

    if (users.length === 0) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }

    const token = await signToken({ id: user.id, name: user.name, username: user.username, role: user.role, is_verified: user.is_verified });

    const res = NextResponse.json({ message: 'Login successful', user: { id: user.id, name: user.name, role: user.role } });
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
