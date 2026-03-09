import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

async function batchImageCache(urls: string[]): Promise<Map<string, string>> {
  if (urls.length === 0) return new Map();
  const cached = await query<{ post_url: string; image_url: string }>(
    `SELECT post_url, image_url FROM public.thumbnail_url WHERE post_url = ANY($1) AND chanel = 'twitter'`,
    [urls],
  );
  const map = new Map<string, string>();
  (cached as any[]).forEach((r) => map.set(r.post_url, r.image_url));
  return map;
}

// twitter_page_24.py equivalent
// Table: l2_socmed.twitter_post_rank
// Returns: top 3 (highest) + bottom 3 (lowest) by impressions for the given brand+period

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const period = searchParams.get('period'); // "August 2025"

  if (!brand || !period) {
    return NextResponse.json({ error: 'Missing brand or period' }, { status: 400 });
  }

  const months: Record<string, string> = {
    January: '01',
    February: '02',
    March: '03',
    April: '04',
    May: '05',
    June: '06',
    July: '07',
    August: '08',
    September: '09',
    October: '10',
    November: '11',
    December: '12',
  };

  const [monthName, yearStr] = period.split(' ');
  const mm = months[monthName];
  if (!mm) return NextResponse.json({ error: 'Invalid period' }, { status: 400 });

  const monthYear = `${mm}-${yearStr}`;

  try {
    const rows = await query(
      `SELECT
         date::text                                        AS date,
         post_link,
         impressions::numeric                              AS impressions,
         ROUND(er::numeric, 2)                             AS er,
         engagement_a::numeric                             AS engagement
       FROM l2_socmed.twitter_post_rank
       WHERE LOWER(TRIM(brand_name_display)) = LOWER(TRIM($1))
         AND TRIM(month_year) = $2
       ORDER BY impressions DESC`,
      [brand, monthYear],
    );

    const all = (rows as any[]).map((r) => ({
      date: r.date,
      url: r.post_link ?? '',
      impressions: r.impressions != null ? parseFloat(r.impressions) : 0,
      er: r.er != null ? parseFloat(r.er) : 0,
      engagement: r.engagement != null ? parseFloat(r.engagement) : 0,
    }));

    // Batch image cache lookup
    const allUrls = [...new Set(all.map((r) => r.url).filter(Boolean))] as string[];
    const imgMap = await batchImageCache(allUrls);
    const withImages = all.map((r) => ({
      ...r,
      image_url: (r.url && imgMap.get(r.url)) || null,
    }));

    return NextResponse.json({
      highest: withImages.slice(0, 3),
      lowest: withImages.slice(-3).reverse(),
      brand,
      period,
      monthYear,
    });
  } catch (err: unknown) {
    console.error('[tw-best-least API]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'DB error', highest: [], lowest: [] },
      { status: 500 },
    );
  }
}
