import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

async function batchImageCache(urls: string[]): Promise<Map<string, string>> {
  if (urls.length === 0) return new Map();
  const cached = await query<{ post_url: string; image_url: string }>(
    `SELECT post_url, image_url FROM public.thumbnail_url WHERE post_url = ANY($1) AND chanel = 'tiktok'`,
    [urls],
  );
  const map = new Map<string, string>();
  (cached as any[]).forEach((r) => map.set(r.post_url, r.image_url));
  return map;
}

// tiktok_page_18.py (organic) + tiktok_page_19.py (paid) equivalent
// Table: l2_socmed.tiktok_post_rank — Highest/Lowest/Best All Time by rank_type
// ?mode=organic  → organic_top_1/2/3, organic_bottom_1/2/3, best_all_time
// ?mode=paid     → paid_top_1/2/3,    paid_bottom_1/2/3,    best_all_time

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const period = searchParams.get('period'); // "August 2025"
  const mode = (searchParams.get('mode') || 'organic') as 'organic' | 'paid';

  if (!brand || !period) {
    return NextResponse.json({ error: 'Missing brand or period' }, { status: 400 });
  }

  const months: Record<string, string> = {
    January: '01', February: '02', March: '03',    April: '04',
    May: '05',     June: '06',     July: '07',     August: '08',
    September: '09', October: '10', November: '11', December: '12',
  };

  const [monthName, yearStr] = period.split(' ');
  const mm = months[monthName];
  if (!mm) return NextResponse.json({ error: 'Invalid period' }, { status: 400 });

  const monthYear = `${mm}-${yearStr}`;
  const prefix = mode === 'paid' ? 'paid' : 'organic';

  const rankTypes = [
    `${prefix}_top_1`, `${prefix}_top_2`, `${prefix}_top_3`,
    `${prefix}_bottom_1`, `${prefix}_bottom_2`, `${prefix}_bottom_3`,
    'best_all_time',
  ];

  try {
    const rows = await query(
      `SELECT
         views::numeric      AS views,
         engagement::numeric AS engagement,
         vr_rate::numeric    AS vr_rate,
         url,
         rank_type
       FROM l2_socmed.tiktok_post_rank
       WHERE LOWER(brand_name_display) = LOWER($1)
         AND month_year = $2
         AND rank_type = ANY($3::text[])
       ORDER BY rank_type`,
      [brand, monthYear, rankTypes],
    );

    const all = rows as any[];

    // Batch image cache lookup
    const allUrls = [...new Set(all.map((r) => r.url).filter(Boolean))] as string[];
    const imgMap = await batchImageCache(allUrls);

    const parsePost = (r: any) => ({
      views:      r.views      !== null ? parseFloat(r.views)      : null,
      engagement: r.engagement !== null ? parseFloat(r.engagement) : null,
      vr_rate:    r.vr_rate    !== null ? parseFloat(r.vr_rate)    : null,
      url: r.url || null,
      rank_type: r.rank_type,
      image_url: (r.url && imgMap.get(r.url)) || null,
    });

    const highest      = all.filter((r) => r.rank_type.startsWith(`${prefix}_top`)).map(parsePost);
    const lowest       = all.filter((r) => r.rank_type.startsWith(`${prefix}_bottom`)).map(parsePost);
    const bestAllTime  = all.filter((r) => r.rank_type === 'best_all_time').map(parsePost);

    return NextResponse.json({
      highest,
      lowest,
      best_all_time: bestAllTime[0] || null,
      mode,
      brand,
      period,
      monthYear,
    });
  } catch (err: unknown) {
    console.error('[tt-best-least API]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'DB error', highest: [], lowest: [], best_all_time: null },
      { status: 500 },
    );
  }
}
