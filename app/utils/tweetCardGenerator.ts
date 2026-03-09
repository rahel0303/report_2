/**
 * tweetCardGenerator.ts
 *
 * Generates a tweet card PNG using satori (JSX → SVG → PNG),
 * uploads to Cloudinary, and caches in public.thumbnail_url.
 *
 * Server-side only.
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { query } from '@/app/lib/db';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

const CLOUDINARY_CLOUD = process.env.CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_SECRET = process.env.CLOUDINARY_API_SECRET!;

// ── Cloudinary upload (accepts base64 data URI or remote URL) ─────────────

function cloudinarySign(params: Record<string, string>): string {
  const str = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha256').update(str + CLOUDINARY_SECRET).digest('hex');
}

async function uploadBufferToCloudinary(pngBuffer: Buffer): Promise<string> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const folder = 'tw-thumbnails';
  const signature = cloudinarySign({ folder, timestamp });

  const base64 = `data:image/png;base64,${pngBuffer.toString('base64')}`;

  const body = new URLSearchParams({
    file: base64,
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

  if (!res.ok) throw new Error(`Cloudinary upload failed: ${await res.text()}`);
  const data = await res.json();
  return data.secure_url as string;
}

// ── fxtwitter fetch ───────────────────────────────────────────────────────

interface FxTweetData {
  author: string;
  handle: string;
  avatar_url: string | null;
  text: string;
  date: string;
  photo_url: string | null;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const mime = res.headers.get('content-type') || 'image/jpeg';
    return `data:${mime};base64,${Buffer.from(buffer).toString('base64')}`;
  } catch {
    return null;
  }
}

async function fetchTweetData(twitterUrl: string): Promise<FxTweetData | null> {
  try {
    const match = twitterUrl.match(/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/);
    if (!match) return null;
    const [, username, tweetId] = match;

    const res = await fetch(
      `https://api.fxtwitter.com/${username}/status/${tweetId}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TweetCardBot/1.0)' },
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const tweet = data?.tweet;
    if (!tweet) return null;

    return {
      author: tweet.author?.name || username,
      handle: `@${tweet.author?.screen_name || username}`,
      avatar_url: tweet.author?.avatar_url || null,
      text: tweet.text || '',
      date: tweet.created_at ? new Date(tweet.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      photo_url: tweet.media?.photos?.[0]?.url || null,
      likes: tweet.likes || 0,
      retweets: tweet.retweets || 0,
      replies: tweet.replies || 0,
      views: tweet.views || 0,
    };
  } catch (err) {
    console.error('[tweetCardGenerator] fxtwitter fetch error:', err);
    return null;
  }
}

// ── Number formatter ──────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

// ── Satori JSX → SVG ─────────────────────────────────────────────────────

// Load fonts once at module level (from local node_modules)
let _fontData: ArrayBuffer | null = null;
function getFontData(): ArrayBuffer {
  if (!_fontData) {
    const buf = readFileSync(
      join(process.cwd(), 'node_modules/@fontsource/sora/files/sora-latin-400-normal.woff'),
    );
    _fontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  }
  return _fontData;
}

async function generateTweetCardSvg(tweet: FxTweetData): Promise<string> {
  const fontData = getFontData();

  // Pre-fetch images to base64 (satori cannot fetch external URLs)
  const [avatarBase64, photoBase64] = await Promise.all([
    tweet.avatar_url ? fetchImageAsBase64(tweet.avatar_url) : Promise.resolve(null),
    tweet.photo_url ? fetchImageAsBase64(tweet.photo_url) : Promise.resolve(null),
  ]);

  // Truncate long text
  const displayText = tweet.text.length > 220
    ? tweet.text.slice(0, 220) + '…'
    : tweet.text;

  const W = 600;
  const H = photoBase64 ? 500 : 280;

  const jsx = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: W,
        height: H,
        background: '#ffffff',
        borderRadius: 16,
        border: '1.5px solid #e2e8f0',
        fontFamily: 'Inter',
        overflow: 'hidden',
      },
      children: [
        // Header
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px 20px 10px',
            },
            children: [
              // Avatar
              avatarBase64
                ? {
                    type: 'img',
                    props: {
                      src: avatarBase64,
                      style: {
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        flexShrink: 0,
                        objectFit: 'cover',
                      },
                    },
                  }
                : {
                    type: 'div',
                    props: {
                      style: {
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        background: 'linear-gradient(135deg, #1d9bf0, #0f6cbd)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: 18,
                        fontWeight: 700,
                        flexShrink: 0,
                      },
                      children: tweet.author.charAt(0).toUpperCase(),
                    },
                  },
              // Name + handle
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column', gap: 2 },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: 15, fontWeight: 700, color: '#0f172a' },
                        children: tweet.author,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: 13, color: '#64748b' },
                        children: tweet.handle,
                      },
                    },
                  ],
                },
              },
              // X logo
              {
                type: 'div',
                props: {
                  style: {
                    marginLeft: 'auto',
                    fontSize: 20,
                    fontWeight: 900,
                    color: '#000000',
                  },
                  children: '𝕏',
                },
              },
            ],
          },
        },
        // Tweet text
        {
          type: 'div',
          props: {
            style: {
              padding: '0 20px',
              fontSize: 15,
              lineHeight: 1.55,
              color: '#1e293b',
              flexShrink: 0,
            },
            children: displayText,
          },
        },
        // Photo (if available)
        ...(photoBase64
          ? [
              {
                type: 'img',
                props: {
                  src: photoBase64,
                  style: {
                    width: W,
                    height: 220,
                    objectFit: 'cover',
                    marginTop: 12,
                    flexShrink: 0,
                  },
                },
              },
            ]
          : []),
        // Divider
        {
          type: 'div',
          props: {
            style: {
              height: 1,
              background: '#f1f5f9',
              margin: '10px 0 0',
            },
          },
        },
        // Stats row
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '10px 20px',
              fontSize: 13,
              color: '#64748b',
            },
            children: [
              { type: 'div', props: { children: `💬 ${fmt(tweet.replies)}` } },
              { type: 'div', props: { children: `🔁 ${fmt(tweet.retweets)}` } },
              { type: 'div', props: { children: `❤️ ${fmt(tweet.likes)}` } },
              { type: 'div', props: { children: `👁 ${fmt(tweet.views)}` } },
              {
                type: 'div',
                props: {
                  style: { marginLeft: 'auto', fontSize: 12, color: '#94a3b8' },
                  children: tweet.date,
                },
              },
            ],
          },
        },
      ],
    },
  };

  return satori(jsx as any, {
    width: W,
    height: H,
    fonts: [
      { name: 'Inter', data: fontData, weight: 400, style: 'normal' },
      { name: 'Inter', data: fontData, weight: 700, style: 'normal' },
    ],
  });
}

// ── Public API ────────────────────────────────────────────────────────────

export async function generateAndCacheTweetCard(postUrl: string): Promise<string | null> {
  if (!postUrl) return null;

  // 1. Check DB cache
  try {
    const cached = await query<{ image_url: string }>(
      'SELECT image_url FROM public.thumbnail_url WHERE post_url = $1 AND chanel = $2 LIMIT 1',
      [postUrl, 'twitter'],
    );
    if (cached.length > 0) return cached[0].image_url;
  } catch (err) {
    console.error('[tweetCardGenerator] cache read error:', err);
  }

  // 2. Fetch tweet data from fxtwitter
  const tweet = await fetchTweetData(postUrl);
  if (!tweet) return null;

  // 3. Generate SVG card via satori
  let svg: string;
  try {
    svg = await generateTweetCardSvg(tweet);
  } catch (err) {
    console.error('[tweetCardGenerator] satori error:', err);
    return null;
  }

  // 4. Convert SVG → PNG
  let pngBuffer: Buffer;
  try {
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 600 } });
    pngBuffer = Buffer.from(resvg.render().asPng());
  } catch (err) {
    console.error('[tweetCardGenerator] resvg error:', err);
    return null;
  }

  // 5. Upload to Cloudinary
  let cloudinaryUrl: string;
  try {
    cloudinaryUrl = await uploadBufferToCloudinary(pngBuffer);
  } catch (err) {
    console.error('[tweetCardGenerator] Cloudinary error:', err);
    return null;
  }

  // 6. Save to cache
  try {
    await query(
      'INSERT INTO public.thumbnail_url (post_url, chanel, image_url, created_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING',
      [postUrl, 'twitter', cloudinaryUrl],
    );
  } catch (err) {
    console.error('[tweetCardGenerator] cache write error:', err);
  }

  return cloudinaryUrl;
}
