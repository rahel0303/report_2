import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { createSession, UserPayload } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

interface User {
  id: number;
  name: string;
  username: string;
  password: string;
  agency_id: number | null;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password harus diisi' }, { status: 400 });
    }

    // Query user dari database
    const users = await query<User>(
      `SELECT id, name, username, password, agency_id, role
       FROM users
       WHERE username = $1`,
      [username],
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    const user = users[0];

    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    // Buat session
    const userPayload: UserPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      agency_id: user.agency_id,
    };

    await createSession(userPayload);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        agency_id: user.agency_id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
