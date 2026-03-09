import { NextRequest, NextResponse } from 'next/server';
import { fetchAndCacheImage } from '@/app/utils/apifyImageFetcher';

export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const channel = searchParams.get('channel') || 'instagram';

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    const image_url = await fetchAndCacheImage(url, channel);
    return NextResponse.json({ image_url });
  } catch (err) {
    console.error('[ig-thumbnail API]', err);
    return NextResponse.json({ image_url: null }, { status: 200 });
  }
}
