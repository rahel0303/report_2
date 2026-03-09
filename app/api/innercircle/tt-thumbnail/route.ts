import { NextRequest, NextResponse } from 'next/server';
import { fetchAndCacheTiktokImage } from '@/app/utils/apifyImageFetcher';

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    const image_url = await fetchAndCacheTiktokImage(url);
    return NextResponse.json({ image_url });
  } catch (err) {
    console.error('[tt-thumbnail API]', err);
    return NextResponse.json({ image_url: null }, { status: 200 });
  }
}
