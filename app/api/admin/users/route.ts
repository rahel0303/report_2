import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

interface User {
  id: number;
  name: string;
  username: string;
  password?: string;
  agency_id: number | null;
  role: string;
  created_at: string;
  updated_at: string;
  agency_name?: string;
}

// Middleware cek admin
async function checkAdmin() {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Forbidden', status: 403 };
  return { session };
}

// GET - List all users
export async function GET() {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const users = await query<User>(
      `SELECT u.id, u.name, u.username, u.agency_id, u.role, u.created_at, u.updated_at,
              a.name as agency_name
       FROM users u
       LEFT JOIN agencies a ON u.agency_id = a.id
       ORDER BY u.id DESC`,
    );

    return NextResponse.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { name, username, password, agency_id, role } = body;

    if (!name || !username || !password) {
      return NextResponse.json({ error: 'Name, username, dan password wajib diisi' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query<User>(
      `INSERT INTO users (name, username, password, agency_id, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, username, agency_id, role, created_at, updated_at`,
      [name, username, hashedPassword, agency_id || null, role || 'user'],
    );

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Create user error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
