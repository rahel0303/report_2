import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// Maps platform param → DB table (matches overview_page_4/5/6.py)
const TABLE_MAP: Record<string, string> = {
  instagram: 'ig_daily_sentiment_count',
  tiktok: 'tiktok_daily_sentiment_count',
  facebook: 'fb_daily_sentiment_count',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const period = searchParams.get('period'); // "January 2026"
  const platform = searchParams.get('platform')?.toLowerCase();

  if (!brand || !period || !platform) {
    return NextResponse.json({ error: 'Missing brand, period, or platform' }, { status: 400 });
  }

  const table = TABLE_MAP[platform];
  if (!table) {
    return NextResponse.json({ error: `Unknown platform: ${platform}` }, { status: 400 });
  }

  // Parse "January 2026" → "01-2026"
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

  const monthYearMMYYYY = `${mm}-${yearStr}`;

  const sql = `
    SELECT
      post_date,
      COALESCE(sentiment_neutral, 0)  AS neutral,
      COALESCE(sentiment_positive, 0) AS positive,
      COALESCE(sentiment_negative, 0) AS negative,
      neutral_text,
      positive_text,
      negative_text
    FROM l2_socmed.${table}
    WHERE LOWER(brand_name_display) = LOWER($1)
      AND month_year = $2
    ORDER BY post_date;
  `;

  const targetPrefix = `${yearStr}-${mm}`;

  const toDateStr = (v: unknown): string => {
    if (v instanceof Date) {
      const y = v.getFullYear();
      const mo = String(v.getMonth() + 1).padStart(2, '0');
      const d = String(v.getDate()).padStart(2, '0');
      return `${y}-${mo}-${d}`;
    }
    return String(v).slice(0, 10);
  };

  try {
    const rawRows = await query<{
      post_date: unknown;
      neutral: number;
      positive: number;
      negative: number;
      neutral_text: string | null;
      positive_text: string | null;
      negative_text: string | null;
    }>(sql, [brand, monthYearMMYYYY]);

    const rows = rawRows
      .map((r) => ({ ...r, post_date: toDateStr(r.post_date) }))
      .filter((r) => r.post_date.startsWith(targetPrefix));

    // Tokenize text into word frequencies (mirrors Python build_tokens / clean_text)
    function tokenize(texts: (string | null)[]): Record<string, number> {
      const freq: Record<string, number> = {};
      const words = texts
        .join(' ')
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, '')
        .replace(/@\w+/g, '')
        .replace(/#\w+/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2);
      for (const w of words) freq[w] = (freq[w] || 0) + 1;
      return freq;
    }

    function topN(freq: Record<string, number>, n: number) {
      return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([word, count]) => ({ word, count }));
    }

    return NextResponse.json({
      data: rows,
      neutralKeywords: topN(tokenize(rows.map((r) => r.neutral_text)), 100),
      positiveKeywords: topN(tokenize(rows.map((r) => r.positive_text)), 100),
      negativeKeywords: topN(tokenize(rows.map((r) => r.negative_text)), 100),
      brand,
      period,
      platform,
    });
  } catch (error) {
    console.error(`[innercircle/channel-sentiment/${platform}] Error:`, error);
    return NextResponse.json({ error: String(error), data: [] }, { status: 500 });
  }
}
