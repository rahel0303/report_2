import { NextRequest, NextResponse } from 'next/server';
import { createSession, UserPayload } from '@/app/lib/auth';

// Mock users untuk testing
const MOCK_USERS = [
  {
    id: 1,
    username: 'user1',
    password: '123456',
    name: 'User Demo 1',
    role: 'user',
    agency_id: 1,
  },
  {
    id: 2,
    username: 'admin',
    password: 'admin123',
    name: 'Admin',
    role: 'admin',
    agency_id: null,
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password harus diisi' }, { status: 400 });
    }

    // Find user dari mock data
    const user = MOCK_USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
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
