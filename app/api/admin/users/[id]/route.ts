import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

interface User {
  id: number;
  name: string;
  username: string;
  agency_id: number | null;
  role: string;
}

async function checkAdmin() {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Forbidden', status: 403 };
  return { session };
}

// GET - Get single user
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const users = await query<User>(
      `SELECT id, name, username, agency_id, role, created_at, updated_at FROM users WHERE id = $1`,
      [id],
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, username, password, agency_id, role } = body;

    let updateQuery = `UPDATE users SET name = $1, username = $2, agency_id = $3, role = $4`;
    let queryParams: any[] = [name, username, agency_id || null, role || 'user'];

    // Jika password diisi, update juga password
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += `, password = $5 WHERE id = $6 RETURNING id, name, username, agency_id, role`;
      queryParams.push(hashedPassword, id);
    } else {
      updateQuery += ` WHERE id = $5 RETURNING id, name, username, agency_id, role`;
      queryParams.push(id);
    }

    const result = await query<User>(updateQuery, queryParams);

    if (result.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Update user error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  // Jangan hapus diri sendiri
  if (auth.session.id === parseInt(id)) {
    return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 });
  }

  try {
    const result = await query<{ id: number }>(`DELETE FROM users WHERE id = $1 RETURNING id`, [id]);

    if (result.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
