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
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { name, username, role, company_id, password, is_verified } = body;

  if (!name || !username || !role) {
    return NextResponse.json({ error: 'Name, username, and role are required' }, { status: 400 });
  }

  if (!['admin', 'user'].includes(role)) {
    return NextResponse.json({ error: 'Role must be admin or user' }, { status: 400 });
  }

  let result: UserRow[];

  if (password && password.trim()) {
    const hashedPassword = await bcrypt.hash(password, 10);
    result = await query<UserRow>(
      `UPDATE public.users
       SET name = $1, username = $2, role = $3, company_id = $4, password = $5, is_verified = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, username, role, company_id`,
      [name.trim(), username.trim(), role, company_id || null, hashedPassword, is_verified ?? true, id]
    );
  } else {
    result = await query<UserRow>(
      `UPDATE public.users
       SET name = $1, username = $2, role = $3, company_id = $4, is_verified = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING id, name, username, role, company_id`,
      [name.trim(), username.trim(), role, company_id || null, is_verified ?? true, id]
    );
  }

  if (result.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  if (String(session.id) === String(id)) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  await query('DELETE FROM public.users WHERE id = $1', [id]);

  return NextResponse.json({ success: true });
}
