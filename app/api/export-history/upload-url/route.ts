import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/auth';
import { getSignedUploadUrl } from '@/app/lib/gcs';

// GET — Generate signed upload URL for direct browser → GCS upload
// Query params: brandSlug, period, isPartial
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const brandSlug = searchParams.get('brandSlug') ?? 'export';
    const period = searchParams.get('period') ?? 'unknown';
    const isPartial = searchParams.get('isPartial') === 'true';

    const suffix = isPartial ? 'partial' : 'allslides';
    const objectName = `exports/${session.id}/${brandSlug}_${period}_${suffix}_${Date.now()}.pptx`;

    const signedUrl = await getSignedUploadUrl(objectName);
    return NextResponse.json({ signedUrl, objectName });
  } catch (error) {
    console.error('Signed URL error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
