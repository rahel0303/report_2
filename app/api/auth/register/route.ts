import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/app/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, username, password } = await req.json();

    if (!name || !username || !password) {
      return NextResponse.json({ message: 'Name, username, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if username already exists
    const existing = await query<{ id: number }>(
      'SELECT id FROM public.users WHERE username = $1 LIMIT 1',
      [username.trim()]
    );

    if (existing.length > 0) {
      return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await query(
      `INSERT INTO public.users (name, username, password, role, is_verified)
       VALUES ($1, $2, $3, 'user', false)`,
      [name.trim(), username.trim(), hashedPassword]
    );

    return NextResponse.json({ message: 'Registration successful. Please wait for admin verification.' }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
