import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

interface Agency {
  id: number;
  name: string;
  slug: string;
}

async function checkAdmin() {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Forbidden', status: 403 };
  return { session };
}

// PUT - Update agency
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, slug } = body;

    const result = await query<Agency>(
      `UPDATE agencies SET name = $1, slug = $2 WHERE id = $3
       RETURNING id, name, slug`,
      [name, slug, id],
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Agency tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Update agency error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete agency
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const result = await query<{ id: number }>(`DELETE FROM agencies WHERE id = $1 RETURNING id`, [id]);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Agency tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete agency error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
