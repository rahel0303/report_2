import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/lib/auth';

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const companies = await query<{ id: number; name: string; slug: string; created_at: string }>(
    'SELECT id, name, slug, created_at FROM public.companies ORDER BY name ASC'
  );

  return NextResponse.json(companies);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const slug = generateSlug(name.trim());

  const result = await query<{ id: number; name: string; slug: string; created_at: string }>(
    'INSERT INTO public.companies (name, slug) VALUES ($1, $2) RETURNING id, name, slug, created_at',
    [name.trim(), slug]
  );

  return NextResponse.json(result[0], { status: 201 });
}
