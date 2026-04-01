import { Storage } from '@google-cloud/storage';

const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

function getStorage() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set');
  const credentials = JSON.parse(raw);
  return new Storage({ credentials });
}

function getBucket() {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) throw new Error('GCS_BUCKET_NAME is not set');
  return getStorage().bucket(bucketName);
}

/** Upload PPTX buffer to GCS. Returns the object name (path in bucket). */
export async function uploadToGCS(buffer: Buffer, objectName: string): Promise<void> {
  const file = getBucket().file(objectName);
  await file.save(buffer, {
    contentType: PPTX_MIME,
    resumable: false,
  });
}

/** Download file from GCS and return as Buffer. */
export async function downloadFromGCS(objectName: string): Promise<Buffer> {
  const file = getBucket().file(objectName);
  const [buffer] = await file.download();
  return buffer;
}

/** Generate a signed URL for direct browser upload to GCS (valid 15 minutes). */
export async function getSignedUploadUrl(objectName: string): Promise<string> {
  const file = getBucket().file(objectName);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType: PPTX_MIME,
  });
  return url;
}

/** Delete a file from GCS. */
export async function deleteFromGCS(objectName: string): Promise<void> {
  try {
    await getBucket().file(objectName).delete();
  } catch {
    // Ignore if file doesn't exist
  }
}
