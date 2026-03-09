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

// tiktok_page_20.py equivalent
// Table: l1_socmed.tiktok_post — Content Pillar analysis, sorted Lowest→Highest by play_count
// Returns first 2 distinct pillars, 3 posts each (sorted ASC by play_count)

const PILLAR_EXCLUDE = `(
  'BNI wondrX 2025', 'By Client', 'By client', 'by client', 'x', ''
)`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const period = searchParams.get('period'); // "August 2025"

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

  try {
    // Get distinct content pillars (ordered)
    const pillarRows = await query<{ content_pillar: string }>(
      `SELECT DISTINCT content_pillar
       FROM l1_socmed.tiktok_post
       WHERE LOWER(brand_name_display) = LOWER($1)
         AND month_year = $2
         AND content_pillar IS NOT NULL
         AND TRIM(content_pillar) NOT IN ${PILLAR_EXCLUDE}
       ORDER BY content_pillar ASC
       LIMIT 2`,
      [brand, monthYear],
    );

    const pillars = (pillarRows as any[]).map((r) => r.content_pillar as string);

    // For each pillar: fetch posts sorted ASC by play_count (Lowest → Highest), limit 3
    const pillarData = await Promise.all(
      pillars.map(async (pillar) => {
        const postRows = await query(
          `SELECT
             content_pillar,
             post_date::text                AS post_date,
             vr_rate::numeric               AS vr_rate,
             play_count::numeric            AS views,
             engagement_a::numeric          AS engagement,
             avg_watch_time::numeric        AS avg_watch_time,
             url
           FROM l1_socmed.tiktok_post
           WHERE LOWER(brand_name_display) = LOWER($1)
             AND month_year = $2
             AND content_pillar = $3
             AND TRIM(content_pillar) NOT IN ${PILLAR_EXCLUDE}
           ORDER BY play_count::numeric ASC NULLS LAST
           LIMIT 3`,
          [brand, monthYear, pillar],
        );

        // Batch image cache lookup for this pillar
        const pillarUrls = [...new Set((postRows as any[]).map((r) => r.url).filter(Boolean))] as string[];
        const imgMap = await batchImageCache(pillarUrls);

        return {
          pillar,
          posts: (postRows as any[]).map((r) => ({
            post_date:      r.post_date || null,
            vr_rate:        r.vr_rate        !== null ? parseFloat(r.vr_rate)        : null,
            views:          r.views          !== null ? parseFloat(r.views)          : null,
            engagement:     r.engagement     !== null ? parseFloat(r.engagement)     : null,
            avg_watch_time: r.avg_watch_time !== null ? parseFloat(r.avg_watch_time) : null,
            url: r.url || null,
            image_url: (r.url && imgMap.get(r.url)) || null,
          })),
        };
      }),
    );

    return NextResponse.json({ pillars: pillarData, brand, period, monthYear });
  } catch (err: unknown) {
    console.error('[tt-content-pillar API]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'DB error', pillars: [] },
      { status: 500 },
    );
  }
}
