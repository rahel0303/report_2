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

// twitter_page_23.py equivalent
// Table: l2_socmed.twitter_post_pov
// Returns: brand-owned posts (is_aon=true) + 1 best per pillar for non-brand (is_aon=false)

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

  const year = parseInt(yearStr);
  const mo = parseInt(mm);
  const firstDay = `${yearStr}-${mm}-01`;
  const lastMo = mo === 12 ? 1 : mo + 1;
  const lastYr = mo === 12 ? year + 1 : year;
  const lastDay = `${lastYr}-${String(lastMo).padStart(2, '0')}-01`;

  try {
    const rows = await query(
      `SELECT
         content_pillar,
         date::text    AS date,
         engagement_a::numeric AS engagement,
         impressions::numeric  AS impressions,
         ROUND(er::numeric, 2) AS er,
         post_link,
         is_aon
       FROM l2_socmed.twitter_post_pov
       WHERE impressions IS NOT NULL
         AND LOWER(brand_name_display) = LOWER($1)
         AND date >= $2 AND date < $3
       ORDER BY impressions DESC`,
      [brand, firstDay, lastDay],
    );

    const all = rows as any[];

    // Brand-owned (is_aon = true): top by impressions (max 1, per python page 23)
    const brandOwned = all
      .filter((r) => r.is_aon === true || r.is_aon === 't' || r.is_aon === 1)
      .slice(0, 1)
      .map((r) => ({
        content_pillar: r.content_pillar ?? '',
        date: r.date,
        engagement: r.engagement != null ? parseFloat(r.engagement) : 0,
        impressions: r.impressions != null ? parseFloat(r.impressions) : 0,
        er: r.er != null ? parseFloat(r.er) : 0,
        url: r.post_link ?? '',
      }));

    // Non-brand (is_aon = false): 1 best per pillar (max 4 pillars)
    // Match Python: sort_values(["content_pillar","impressions"], asc=[True,False])
    //               → groupby("content_pillar").first() → head(4)
    // i.e. best impression per pillar, then take first 4 pillars ALPHABETICALLY.
    const nonBrandRaw = all.filter((r) => r.is_aon === false || r.is_aon === 'f' || r.is_aon === 0);
    const pillarMap = new Map<string, any>();
    for (const r of nonBrandRaw) {
      const p = (r.content_pillar ?? 'Other') as string;
      // all rows already sorted by impressions DESC, so first insert = best impression
      if (!pillarMap.has(p)) {
        pillarMap.set(p, r);
      }
    }
    // Sort pillars alphabetically, then take first 4 (same as Python head(4) after sort_values pillar ASC)
    const nonBrandOwned = Array.from(pillarMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 4)
      .map(([, r]) => r)
      .map((r) => ({
        content_pillar: r.content_pillar ?? '',
        date: r.date,
        engagement: r.engagement != null ? parseFloat(r.engagement) : 0,
        impressions: r.impressions != null ? parseFloat(r.impressions) : 0,
        er: r.er != null ? parseFloat(r.er) : 0,
        url: r.post_link ?? '',
      }));

    // Batch image cache lookup
    const allUrls = [...new Set(
      [...brandOwned, ...nonBrandOwned].map((r) => r.url).filter(Boolean)
    )] as string[];
    const imgMap = await batchImageCache(allUrls);
    const withImg = (arr: any[]) => arr.map((r) => ({ ...r, image_url: (r.url && imgMap.get(r.url)) || null }));

    return NextResponse.json({
      brandOwned: withImg(brandOwned),
      nonBrandOwned: withImg(nonBrandOwned),
      brand,
      period,
    });
  } catch (err: unknown) {
    console.error('[tw-content API]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'DB error', brandOwned: [], nonBrandOwned: [] },
      { status: 500 },
    );
  }
}
