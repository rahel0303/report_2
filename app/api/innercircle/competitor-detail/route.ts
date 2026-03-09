import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

async function batchImageCache(urls: string[], channel: string): Promise<Map<string, string>> {
  if (urls.length === 0) return new Map();
  const cached = await query<{ post_url: string; image_url: string }>(
    `SELECT post_url, image_url FROM public.thumbnail_url WHERE post_url = ANY($1) AND chanel = $2`,
    [urls, channel],
  );
  const map = new Map<string, string>();
  (cached as any[]).forEach((r) => map.set(r.post_url, r.image_url));
  return map;
}

// competitor_page_detail.py equivalent
// Top 3 posts per channel for a specific competitor
// IG   → l1_socmed.fact_ig_daily_competitor   (by ig_engagement DESC)
// TT   → l1_socmed.tiktok_post               (by play_count DESC)
// TW   → l2_socmed.twitter_post_pov_competitor (by engagement_b DESC)

const MONTH_MAP: Record<string, string> = {
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const period = searchParams.get('period');
  const competitor = searchParams.get('competitor');

  if (!brand || !period || !competitor) {
    return NextResponse.json({ error: 'Missing brand, period, or competitor' }, { status: 400 });
  }

  const [monthName, yearStr] = period.split(' ');
  const mm = MONTH_MAP[monthName];
  if (!mm) return NextResponse.json({ error: `Invalid period: ${period}` }, { status: 400 });
  const monthYear = `${mm}-${yearStr}`;

  try {
    const [igRes, ttRes, twRes] = await Promise.all([
      // ── Instagram Top 3 by ig_engagement ─────────────────────────────────
      query(
        `SELECT
            ig_engagement::numeric AS ig_engagement,
            permalink
         FROM l1_socmed.fact_ig_daily_competitor
         WHERE LOWER(brand_name_display) = LOWER($1)
           AND month_year = $2
         ORDER BY ig_engagement::numeric DESC NULLS LAST
         LIMIT 3`,
        [competitor, monthYear],
      ),

      // ── TikTok Top 3 by play_count ────────────────────────────────────────
      query(
        `SELECT
            play_count::numeric    AS play_count,
            engagement_b::numeric  AS engagement_b,
            url
         FROM l1_socmed.tiktok_post
         WHERE LOWER(brand_name_display) = LOWER($1)
           AND month_year = $2
         ORDER BY play_count::numeric DESC NULLS LAST
         LIMIT 3`,
        [competitor, monthYear],
      ),

      // ── Twitter Top 3 by engagement_b ─────────────────────────────────────
      query(
        `SELECT
            engagement_b::numeric  AS engagement_b,
            url
         FROM l2_socmed.twitter_post_pov_competitor
         WHERE LOWER(brand_name_display) = LOWER($1)
           AND month_year = $2
         ORDER BY engagement_b::numeric DESC NULLS LAST
         LIMIT 3`,
        [competitor, monthYear],
      ),
    ]);

    const p = (v: any): number | null => (v == null ? null : parseFloat(v));

    const igRaw = (igRes as any[]).map((r) => ({
      ig_engagement: p(r.ig_engagement),
      permalink: r.permalink || null,
    }));
    const ttRaw = (ttRes as any[]).map((r) => ({
      play_count: p(r.play_count),
      engagement_b: p(r.engagement_b),
      url: r.url || null,
    }));
    const twRaw = (twRes as any[]).map((r) => ({
      engagement_b: p(r.engagement_b),
      url: r.url || null,
    }));

    // Batch image cache lookup per channel
    const [igImgMap, ttImgMap, twImgMap] = await Promise.all([
      batchImageCache(igRaw.map((r) => r.permalink).filter(Boolean) as string[], 'instagram'),
      batchImageCache(ttRaw.map((r) => r.url).filter(Boolean) as string[], 'tiktok'),
      batchImageCache(twRaw.map((r) => r.url).filter(Boolean) as string[], 'twitter'),
    ]);

    const igPosts = igRaw.map((r) => ({ ...r, image_url: (r.permalink && igImgMap.get(r.permalink)) || null }));
    const ttPosts = ttRaw.map((r) => ({ ...r, image_url: (r.url && ttImgMap.get(r.url)) || null }));
    const twPosts = twRaw.map((r) => ({ ...r, image_url: (r.url && twImgMap.get(r.url)) || null }));

    return NextResponse.json({ igPosts, ttPosts, twPosts, competitor, brand, period });
  } catch (err: any) {
    console.error('[competitor-detail] error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
