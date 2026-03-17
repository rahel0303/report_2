import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

const CLOUDINARY_CLOUD = process.env.CLOUDINARY_CLOUD_NAME!;
const CLOUDINARY_KEY = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_SECRET = process.env.CLOUDINARY_API_SECRET!;

function cloudinarySign(params: Record<string, string>): string {
  const str = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return createHash('sha256').update(str + CLOUDINARY_SECRET).digest('hex');
}

// POST — Upload cover image (base64) to Cloudinary
export async function POST(request: NextRequest) {
  try {
    const { base64 } = await request.json();
    if (!base64) {
      return NextResponse.json({ error: 'Missing base64' }, { status: 400 });
    }

    const timestamp = String(Math.floor(Date.now() / 1000));
    const folder = 'report-covers';
    const signature = cloudinarySign({ folder, timestamp });

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

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cloudinary upload failed: ${text}`);
    }

    const data = await res.json();
    return NextResponse.json({ url: data.secure_url });
  } catch (error) {
    console.error('Cover image upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
