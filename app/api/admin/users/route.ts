import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

interface UserRow {
  id: number;
  name: string;
  username: string;
  role: string;
  company_id: number | null;
  is_verified: boolean;
  created_at: string;
  company_name: string | null;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const users = await query<UserRow>(
    `SELECT u.id, u.name, u.username, u.role, u.company_id, u.is_verified, u.created_at, c.name as company_name
     FROM public.users u
     LEFT JOIN public.companies c ON c.id = u.company_id
     ORDER BY u.name ASC`
  );

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { name, username, password, role, company_id } = body;

  if (!name || !username || !password || !role) {
    return NextResponse.json({ error: 'Name, username, password, and role are required' }, { status: 400 });
  }

  if (!['admin', 'user'].includes(role)) {
    return NextResponse.json({ error: 'Role must be admin or user' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await query<UserRow>(
    `INSERT INTO public.users (name, username, password, role, company_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, username, role, company_id, created_at`,
    [name.trim(), username.trim(), hashedPassword, role, company_id || null]
  );

  return NextResponse.json(result[0], { status: 201 });
}
