import { NextRequest, NextResponse } from 'next/server';
import { generateAndCacheTweetCard } from '@/app/utils/tweetCardGenerator';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    console.log('[tw-thumbnail] generating card for:', url);
    const image_url = await generateAndCacheTweetCard(url);
    console.log('[tw-thumbnail] result:', image_url ? 'ok' : 'null');
    return NextResponse.json({ image_url });
  } catch (err) {
    console.error('[tw-thumbnail API] error:', err);
    return NextResponse.json({ image_url: null }, { status: 200 });
  }
}
