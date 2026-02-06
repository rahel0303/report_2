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
}

async function checkAdmin() {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized', status: 401 };
  if (session.role !== 'admin') return { error: 'Forbidden', status: 403 };
  return { session };
}

// GET - Get single company
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const companies = await query<Company>(`SELECT * FROM companies WHERE id = $1`, [id]);

    if (companies.length === 0) {
      return NextResponse.json({ error: 'Company tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(companies[0]);
  } catch (error) {
    console.error('Get company error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Update company
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

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

    const result = await query<Company>(
      `UPDATE companies
       SET name = $1, brand_name_display = $2, slug = $3, username_instagram = $4,
           username_tiktok = $5, username_facebook = $6, username_twitter = $7, brand_name_identifier = $8
       WHERE id = $9
       RETURNING *`,
      [name, brand_name_display, slug, username_instagram, username_tiktok, username_facebook, username_twitter, brand_name_identifier, id],
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Company tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Update company error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete company
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const result = await query<{ id: number }>(`DELETE FROM companies WHERE id = $1 RETURNING id`, [id]);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Company tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete company error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
