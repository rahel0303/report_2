import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

interface Company {
  id: number;
  name: string;
  brand_name_display: string | null;
  slug: string;
  username_instagram: string | null;
  username_tiktok: string | null;
  username_facebook: string | null;
  username_twitter: string | null;
  brand_name_identifier: string | null;
  created_at: string;
  updated_at: string;
}

async function checkAdmin() {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Forbidden', status: 403 };
  return { session };
}

// GET - List all companies
export async function GET() {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const companies = await query<Company>(
      `SELECT * FROM companies ORDER BY name ASC`,
    );
    return NextResponse.json(companies);
  } catch (error) {
    console.error('Get companies error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create new company
export async function POST(request: NextRequest) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const {
      name,
      brand_name_display,
      slug,
      username_instagram,
      username_tiktok,
      username_facebook,
      username_twitter,
      brand_name_identifier,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name dan slug wajib diisi' }, { status: 400 });
    }

    const result = await query<Company>(
      `INSERT INTO companies (name, brand_name_display, slug, username_instagram, username_tiktok, username_facebook, username_twitter, brand_name_identifier)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, brand_name_display, slug, username_instagram, username_tiktok, username_facebook, username_twitter, brand_name_identifier],
    );

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Create company error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
