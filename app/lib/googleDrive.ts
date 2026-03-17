import { google } from 'googleapis';
import { Readable } from 'stream';

const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set');
  const credentials = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
}

export async function uploadToDrive(
  buffer: Buffer,
  fileName: string,
): Promise<{ fileId: string; driveUrl: string }> {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set');

  const stream = Readable.from(buffer);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
      mimeType: PPTX_MIME,
    },
    media: { mimeType: PPTX_MIME, body: stream },
    fields: 'id',
    supportsAllDrives: true,
  });

  const fileId = res.data.id!;

  // Make file accessible to anyone with the link
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
    supportsAllDrives: true,
  });

  const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  return { fileId, driveUrl };
}
