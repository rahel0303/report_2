/**
 * apifyImageFetcher.ts
 *
 * Fetches Instagram post thumbnail via Apify instagram-scraper,
 * uploads to Cloudinary, and caches result in public.thumbnail_image.
 *
 * Server-side only (Node.js API routes).
 */

import { createHash } from 'crypto';
import { query } from '@/app/lib/db';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN!;
const CLOUDINARY_CLOUD = process.env.CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_SECRET = process.env.CLOUDINARY_API_SECRET!;

// ---------- Cloudinary ----------

function cloudinarySign(params: Record<string, string>): string {
  const str = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha256').update(str + CLOUDINARY_SECRET).digest('hex');
}

async function uploadToCloudinary(imageUrl: string): Promise<string> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const folder = 'ig-thumbnails';
  const signature = cloudinarySign({ folder, timestamp });

  const body = new URLSearchParams({
    file: imageUrl,
    api_key: CLOUDINARY_KEY,
    timestamp,
    folder,
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${text}`);
  }

  const data = await res.json();
  return data.secure_url as string;
}

// ---------- Apify ----------

async function fetchApifyImage(instagramUrl: string): Promise<string | null> {
  const input = {
    addParentData: false,
    directUrls: [instagramUrl],
    resultsLimit: 1,
    resultsType: 'posts',
    searchLimit: 1,
    searchType: 'hashtag',
  };

  let res: Response;
  try {
    res = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=60`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(90_000),
      },
    );
  } catch (err) {
    console.error('[apifyImageFetcher] Apify fetch error:', err);
    return null;
  }

  if (!res.ok) {
    console.error('[apifyImageFetcher] Apify non-OK:', res.status, await res.text());
    return null;
  }

  let items: any[];
  try {
    items = await res.json();
  } catch {
    return null;
  }

  if (!Array.isArray(items) || items.length === 0) return null;

  // Instagram scraper returns displayUrl or imageUrl
  return items[0].displayUrl || items[0].imageUrl || null;
}

// ---------- Twitter fxtwitter ----------

async function fetchTwitterThumbnail(twitterUrl: string): Promise<string | null> {
  try {
    // Parse username + tweet ID from twitter.com or x.com URL
    const match = twitterUrl.match(/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/);
    if (!match) return null;
    const [, username, tweetId] = match;

    const res = await fetch(
      `https://api.fxtwitter.com/${username}/status/${tweetId}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ThumbnailBot/1.0)' },
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const media = data?.tweet?.media;
    if (!media) return null;
    // Prefer photo URL, fallback to video thumbnail
    if (media.photos?.[0]?.url) return media.photos[0].url;
    if (media.videos?.[0]?.thumbnail_url) return media.videos[0].thumbnail_url;
    return null;
  } catch (err) {
    console.error('[apifyImageFetcher] Twitter fxtwitter error:', err);
    return null;
  }
}

// ---------- TikTok oEmbed ----------

async function fetchTiktokThumbnail(tiktokUrl: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(tiktokUrl)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ThumbnailBot/1.0)',
        },
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail_url || null;
  } catch (err) {
    console.error('[apifyImageFetcher] TikTok oEmbed error:', err);
    return null;
  }
}

// ---------- Public API ----------

/**
 * Returns Cloudinary image URL for a single Instagram post URL.
 * Checks DB cache first; fetches via Apify + Cloudinary if not cached.
 */
export async function fetchAndCacheImage(
  postUrl: string,
  channel: string,
): Promise<string | null> {
  if (!postUrl) return null;

  // 1. Check cache
  try {
    const cached = await query<{ image_url: string }>(
      'SELECT image_url FROM public.thumbnail_url WHERE post_url = $1 AND chanel = $2 LIMIT 1',
      [postUrl, channel],
    );
    if (cached.length > 0) return cached[0].image_url;
  } catch (err) {
    console.error('[apifyImageFetcher] Cache read error:', err);
  }

  // 2. Fetch raw image URL from Apify
  const rawImageUrl = await fetchApifyImage(postUrl);
  if (!rawImageUrl) return null;

  // 3. Upload to Cloudinary
  let cloudinaryUrl: string;
  try {
    cloudinaryUrl = await uploadToCloudinary(rawImageUrl);
  } catch (err) {
    console.error('[apifyImageFetcher] Cloudinary error:', err);
    return null;
  }

  // 4. Save to cache
  try {
    await query(
      'INSERT INTO public.thumbnail_url (post_url, chanel, image_url, created_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING',
      [postUrl, channel, cloudinaryUrl],
    );
  } catch (err) {
    console.error('[apifyImageFetcher] Cache write error:', err);
  }

  return cloudinaryUrl;
}

/**
 * Returns Cloudinary image URL for a single Twitter/X post URL.
 * Uses fxtwitter API (free, no key needed) to get photo/thumbnail URL,
 * then uploads to Cloudinary and caches in public.thumbnail_url.
 */
export async function fetchAndCacheTwitterImage(postUrl: string): Promise<string | null> {
  if (!postUrl) return null;

  // 1. Check cache
  try {
    const cached = await query<{ image_url: string }>(
      'SELECT image_url FROM public.thumbnail_url WHERE post_url = $1 AND chanel = $2 LIMIT 1',
      [postUrl, 'twitter'],
    );
    if (cached.length > 0) return cached[0].image_url;
  } catch (err) {
    console.error('[apifyImageFetcher] Twitter cache read error:', err);
  }

  // 2. Fetch thumbnail via fxtwitter
  const rawImageUrl = await fetchTwitterThumbnail(postUrl);
  if (!rawImageUrl) return null;

  // 3. Upload to Cloudinary
  let cloudinaryUrl: string;
  try {
    cloudinaryUrl = await uploadToCloudinary(rawImageUrl);
  } catch (err) {
    console.error('[apifyImageFetcher] Twitter Cloudinary error:', err);
    return null;
  }

  // 4. Save to cache
  try {
    await query(
      'INSERT INTO public.thumbnail_url (post_url, chanel, image_url, created_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING',
      [postUrl, 'twitter', cloudinaryUrl],
    );
  } catch (err) {
    console.error('[apifyImageFetcher] Twitter cache write error:', err);
  }

  return cloudinaryUrl;
}

/**
 * Batch version — processes all URLs in parallel.
 * Returns a Map of { instagram_url → cloudinary_url }.
 */
export async function fetchAndCacheImages(
  posts: { url: string | null }[],
  channel: string,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const urls = [...new Set(posts.map((p) => p.url).filter(Boolean) as string[])];

  await Promise.all(
    urls.map(async (url) => {
      const img = await fetchAndCacheImage(url, channel);
      if (img) result.set(url, img);
    }),
  );

  return result;
}

/**
 * Returns Cloudinary image URL for a single TikTok post URL.
 * Uses TikTok oEmbed API (free, no key needed) to get thumbnail_url,
 * then uploads to Cloudinary and caches in public.thumbnail_url.
 */
export async function fetchAndCacheTiktokImage(postUrl: string): Promise<string | null> {
  if (!postUrl) return null;

  // 1. Check cache
  try {
    const cached = await query<{ image_url: string }>(
      'SELECT image_url FROM public.thumbnail_url WHERE post_url = $1 AND chanel = $2 LIMIT 1',
      [postUrl, 'tiktok'],
    );
    if (cached.length > 0) return cached[0].image_url;
  } catch (err) {
    console.error('[apifyImageFetcher] TikTok cache read error:', err);
  }

  // 2. Fetch thumbnail via oEmbed
  const rawImageUrl = await fetchTiktokThumbnail(postUrl);
  if (!rawImageUrl) return null;

  // 3. Upload to Cloudinary
  let cloudinaryUrl: string;
  try {
    cloudinaryUrl = await uploadToCloudinary(rawImageUrl);
  } catch (err) {
    console.error('[apifyImageFetcher] TikTok Cloudinary error:', err);
    return null;
  }

  // 4. Save to cache
  try {
    await query(
      'INSERT INTO public.thumbnail_url (post_url, chanel, image_url, created_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING',
      [postUrl, 'tiktok', cloudinaryUrl],
    );
  } catch (err) {
    console.error('[apifyImageFetcher] TikTok cache write error:', err);
  }

  return cloudinaryUrl;
}
