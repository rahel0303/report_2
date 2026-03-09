import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

async function batchImageCache(urls: string[]): Promise<Map<string, string>> {
  if (urls.length === 0) return new Map();
  const cached = await query<{ post_url: string; image_url: string }>(
    `SELECT post_url, image_url FROM public.thumbnail_url WHERE post_url = ANY($1) AND chanel = 'instagram'`,
    [urls],
  );
  const map = new Map<string, string>();
  (cached as any[]).forEach((r) => map.set(r.post_url, r.image_url));
  return map;
}

// instagram_page_15.py equivalent
// Tables:
//   l1_socmed.ig_tagged_post          — top 3 posts by engagement
//   l2_socmed.ig_tagged_post_monthly  — summary KPIs
//   l1_socmed.ig_sentiment_daily      — sample comments per sentiment

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
    // 1. Top 3 tagged posts by engagement
    const postRows = await query(
      `SELECT
         post_date::text AS post_date,
         engagement::numeric AS engagement,
         url
       FROM l1_socmed.ig_tagged_post
       WHERE LOWER(brand_name_display) = LOWER($1)
         AND month_year = $2
       ORDER BY engagement::numeric DESC NULLS LAST
       LIMIT 3`,
      [brand, monthYear],
    );

    // 2. Monthly summary KPIs
    const summaryRows = await query(
      `SELECT
         total_tagged_post::numeric     AS total_tagged_post,
         total_tagged_post_inc::numeric AS total_tagged_post_inc,
         total_user_count::numeric      AS total_user_count,
         total_user_count_inc::numeric  AS total_user_count_inc
       FROM l2_socmed.ig_tagged_post_monthly
       WHERE LOWER(brand_name_display) = LOWER($1)
         AND month_year = $2
       LIMIT 1`,
      [brand, monthYear],
    );

    // 3. Brand ID (needed for sentiment lookup)
    const brandIdRows = await query<{ brand_id: string }>(
      `SELECT DISTINCT brand_id
       FROM l1_socmed.fact_ig_daily_engagement
       WHERE LOWER(brand_name_display) = LOWER($1)
       LIMIT 1`,
      [brand],
    );
    const brandId = (brandIdRows as any[])[0]?.brand_id ?? null;

    // 4. Sentiment comments (up to 4 per label)
    let sentiments: { Negative: string[]; Positive: string[]; Neutral: string[] } = {
      Negative: [], Positive: [], Neutral: [],
    };

    if (brandId) {
      const sentRows = await query(
        `SELECT comment_text, sentiment_label
         FROM l1_socmed.ig_sentiment_daily
         WHERE brand_id = $1
         LIMIT 40`,
        [brandId],
      );

      const all = sentRows as any[];
      sentiments = {
        Negative: all.filter((r) => r.sentiment_label === 'negative').slice(0, 4).map((r) => r.comment_text as string),
        Positive: all.filter((r) => r.sentiment_label === 'positive').slice(0, 4).map((r) => r.comment_text as string),
        Neutral:  all.filter((r) => r.sentiment_label === 'neutral').slice(0, 4).map((r) => r.comment_text as string),
      };
    }

    const summary = (summaryRows as any[])[0] ?? null;

    // Batch image cache lookup
    const postUrls = (postRows as any[]).map((r) => r.url).filter(Boolean) as string[];
    const imgMap = await batchImageCache([...new Set(postUrls)]);

    return NextResponse.json({
      posts: (postRows as any[]).map((r) => ({
        post_date: r.post_date,
        engagement: r.engagement !== null ? parseFloat(r.engagement) : null,
        url: r.url || null,
        image_url: (r.url && imgMap.get(r.url)) || null,
      })),
      summary: summary
        ? {
            total_tagged_post:     summary.total_tagged_post !== null ? parseFloat(summary.total_tagged_post) : null,
            total_tagged_post_inc: summary.total_tagged_post_inc !== null ? parseFloat(summary.total_tagged_post_inc) : null,
            total_user_count:      summary.total_user_count !== null ? parseFloat(summary.total_user_count) : null,
            total_user_count_inc:  summary.total_user_count_inc !== null ? parseFloat(summary.total_user_count_inc) : null,
          }
        : null,
      sentiments,
      brand,
      period,
      monthYear,
    });
  } catch (err: unknown) {
    console.error('[ig-tagged-post API]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'DB error', posts: [], summary: null, sentiments: { Negative: [], Positive: [], Neutral: [] } },
      { status: 500 },
    );
  }
}
