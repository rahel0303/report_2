import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

// instagram_page_9.py equivalent
// Table: l2_socmed.ig_post_rank — Best 5 & Least 5 posts by engagement
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
    const [bestRows, leastRowsRaw] = await Promise.all([
      query(
        `SELECT
           follows::numeric   AS follows,
           reach::numeric     AS reach,
           engagement::numeric AS engagement,
           engagement_rate::numeric AS engagement_rate,
           url
         FROM l2_socmed.ig_post_rank
         WHERE LOWER(brand_name_display) = LOWER($1)
           AND month_year = $2
           AND rank_type LIKE 'Top%'
         ORDER BY rank ASC`,
        [brand, monthYear],
      ),
      query(
        `SELECT
           follows::numeric   AS follows,
           reach::numeric     AS reach,
           engagement::numeric AS engagement,
           engagement_rate::numeric AS engagement_rate,
           url
         FROM l2_socmed.ig_post_rank
         WHERE LOWER(brand_name_display) = LOWER($1)
           AND month_year = $2
           AND rank_type LIKE 'Bottom%'
         ORDER BY rank ASC`,
        [brand, monthYear],
      ),
    ]);

    // Hapus URL dari least yang sudah ada di best (prioritaskan best)
    const bestUrls = new Set((bestRows as any[]).map((r) => r.url).filter(Boolean));
    const leastRows = (leastRowsRaw as any[]).filter((r) => !bestUrls.has(r.url));

    // Batch check cached thumbnails from DB (fast, no Apify call)
    const allRows = [...bestRows, ...leastRows];
    const urls = [...new Set(allRows.map((r) => r.url).filter(Boolean))] as string[];

    let imageCache = new Map<string, string>();
    if (urls.length > 0) {
      const cached = await query<{ post_url: string; image_url: string }>(
        `SELECT post_url, image_url FROM public.thumbnail_url
         WHERE post_url = ANY($1) AND chanel = 'instagram'`,
        [urls],
      );
      cached.forEach((row) => imageCache.set(row.post_url, row.image_url));
    }

    const parsePost = (r: any) => ({
      follows: r.follows !== null ? parseFloat(r.follows) : null,
      reach: r.reach !== null ? parseFloat(r.reach) : null,
      engagement: r.engagement !== null ? parseFloat(r.engagement) : null,
      engagement_rate: r.engagement_rate !== null ? parseFloat(r.engagement_rate) : null,
      url: r.url || null,
      image_url: (r.url && imageCache.get(r.url)) || null,
    });

    return NextResponse.json({
      best: (bestRows as any[]).map(parsePost),
      least: (leastRows as any[]).map(parsePost),
      brand,
      period,
      monthYear,
    });
  } catch (err: unknown) {
    console.error('[ig-best-least API]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'DB error', best: [], least: [] },
      { status: 500 },
    );
  }
}
