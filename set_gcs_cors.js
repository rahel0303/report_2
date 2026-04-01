const { Storage } = require('@google-cloud/storage');

const credentials = {
  type: "service_account",
  project_id: "report-automation-phase-2",
  private_key_id: "c239497c0d6508031bdf252683fb87c195f0a918",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDd2bHlhALy04yK\nrrDGWUVH6GkuHgnGeUEp3ESDetwgytHQB+m7bFJQQO+f8oz3l2LxVCYXUANcYvlJ\n3Tlo9OGAyjwfqOWdX3TR96pqQNYipz+mA+kkBSWjA3yZ6UErpbpstZOUJmzMeezA\nrx45rp5eVjrCCemih4hUR4Tz7UQ8EAXD/e7Y6UxbyMfZt1ylU7EMOYINRmjmkn6r\nlt7ELELY7stiUVkdSX02Zt7y9xXEYMgVhX5Z+oz/rSevTZWsmhYDoC5xhUSbk/LH\ngSfn6skK6+cQQb2ySYLsOGD0kKrM9eYROBExkV7WHiqaPkhzCAjQPyDOtVXY36FX\n6C4Pdgf9AgMBAAECggEAZolwHi8yN66MRirwnHR1P4ONXZnXlcrEUgczCXv3Exb6\n+4Y0wwIRV3Nz7X7rJaJsQjNM+bhrHT/HjZq4pqiMM30FZfKn0eFlOoiYVMzLzC92\nDRLApnvUhfAeHnr/Op+6NvWDlNVfsvBlezdVJn7tRpffR4DSYeL3oVB/BEj1ITbA\nDpOJcDQQ75AZ/i5nNs2WOX3uttGghQivxpLA2hb0Zu52mqQlXDOVWsXlm9OPcJ4v\nEWXUZALTof971beZ9rdsxxcOC+632rRk2UkUZ2HmR9KHvMCtnnR6rVVnNTHuQzz1\n520KqGJC34cYk1zoqeOPN8u8x3OOaoPBU8aRthidxwKBgQD6CyF2iMBCssTE7lF9\nexCQrhlFTluHjtsDZNvVpjma/lvQvuyqyX4C62ZRgmRb58q9XglDevE/XaNaNY6/\nAzPw3RY1AOTKiMtQlsij0JSD7CLyVUXGwqkd70cjKSKfLxs2nEDZaz4qZcy3V1Gj\nU2KpRn97jJ32VlLrFvhiu8F/5wKBgQDjIqGA9yYs/IMLnAfkWkF2FQK+enL1iT/L\nB+XRVY9yqCZBJwTbn9iZIjnNze91MixgH2SeR3CmsStx+l11eJeyP4TOHQw8NpuF\n882RKns1yZDhOvywMzvC7HySh0wGNMvJ1cCvE55s2Ztt9V17DtnaEsO+bv7X/4MT\nB5kxH7NMewKBgAEr2i1G+LeXRMqzXxhaYjp7Rk0Hz+/zoF0EtO7sR2rNdDqnGk62\ngOuclK8fED9J964paZuyULz+QEyk4ZVNe4nOT1NSPMAiIemvuyLhUEDJ82P1OE11\nDfvA6jFk+O+L9fGsi7U5BmKGdY4KT6yXMGggl2pJv1evEdZeFi3IOWDTAoGBAMcM\nfU6AyNLZw5nz9jKXKhDqXspAkug8jExIMo3eFmUbmNK1+BrkHTQt+0wxce1Zt+vQ\n9yOCZeWfE/zBtQ+STBZodeEPMb6++FJOk1LpUKqVZ0MKp5FehLvQ9WaP7P7vW7wY\nd9C2N7sahIy7X13NaPskQKhtqyXthJezq/uR1VZrAoGBAJYfhM9WRcY7zfqFyvF1\ngrdpHS/mvbv6LYj90y1d7stzmQYx6qsc0dHOc21WtmLe7hVypHRXzaIlOFpXSfqD\nN/fYLGDDI4XJSMSUjNrmgu2986LXQnKdxRStNUSkQhrMwEynaiIx0GKFriOz5cwG\nDiBxO2XMSzYia7flWlI+DjBZ\n-----END PRIVATE KEY-----\n",
  client_email: "autoreport-uploader@report-automation-phase-2.iam.gserviceaccount.com",
  client_id: "114726628188300560756",
};

const BUCKET_NAME = 'autoreport-exports';

async function main() {
  const storage = new Storage({ credentials });
  const bucket = storage.bucket(BUCKET_NAME);

  const corsConfig = [
    {
      origin: ['*'],
      method: ['PUT', 'GET', 'HEAD'],
      responseHeader: [
        'Content-Type',
        'Access-Control-Allow-Origin',
        'x-goog-resumable',
      ],
      maxAgeSeconds: 3600,
    },
  ];

  await bucket.setCorsConfiguration(corsConfig);
  console.log('CORS configured on bucket:', BUCKET_NAME);

  // Verify
  const [meta] = await bucket.getMetadata();
  console.log('Current CORS:', JSON.stringify(meta.cors, null, 2));
}

main().catch(console.error);
