import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

interface Agency {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

async function checkAdmin() {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Forbidden', status: 403 };
  return { session };
}

// GET - List all agencies
export async function GET() {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const agencies = await query<Agency>(
      `SELECT id, name, slug, created_at, updated_at FROM agencies ORDER BY name ASC`,
    );
    return NextResponse.json(agencies);
  } catch (error) {
    console.error('Get agencies error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create new agency
export async function POST(request: NextRequest) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name dan slug wajib diisi' }, { status: 400 });
    }

    const result = await query<Agency>(
      `INSERT INTO agencies (name, slug) VALUES ($1, $2)
       RETURNING id, name, slug, created_at, updated_at`,
      [name, slug],
    );

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Create agency error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
