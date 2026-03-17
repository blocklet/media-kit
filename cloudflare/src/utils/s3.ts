import { AwsClient } from 'aws4fetch';
import { XMLParser } from 'fast-xml-parser';
import type { Env } from '../types';

export function createS3Client(env: Env) {
  return new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    region: 'auto',
    service: 's3',
  });
}

function s3Endpoint(env: Env, key: string) {
  return `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com/media-kit-uploads/${key}`;
}

export async function generatePresignedPutUrl(
  s3: AwsClient,
  env: Env,
  key: string,
  options: {
    expiresIn?: number;
    contentType?: string;
    partNumber?: number;
    uploadId?: string;
  } = {},
) {
  const { expiresIn = 3600, contentType, partNumber, uploadId } = options;
  const url = new URL(s3Endpoint(env, key));

  if (partNumber && uploadId) {
    url.searchParams.set('partNumber', String(partNumber));
    url.searchParams.set('uploadId', uploadId);
  }
  url.searchParams.set('X-Amz-Expires', String(expiresIn));

  const headers: Record<string, string> = {};
  if (contentType) headers['Content-Type'] = contentType;

  const signed = await s3.sign(
    new Request(url.toString(), { method: 'PUT', headers }),
    { aws: { signQuery: true } },
  );

  return signed.url;
}

export async function s3CopyObject(
  s3: AwsClient,
  env: Env,
  sourceKey: string,
  destKey: string,
) {
  const endpoint = s3Endpoint(env, destKey);
  const signed = await s3.sign(
    new Request(endpoint, {
      method: 'PUT',
      headers: {
        'x-amz-copy-source': `/media-kit-uploads/${sourceKey}`,
      },
    }),
  );
  const res = await fetch(signed);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`CopyObject failed: ${res.status} ${body}`);
  }
}

export async function s3CreateMultipartUpload(
  s3: AwsClient,
  env: Env,
  key: string,
  contentType?: string,
): Promise<string> {
  const url = new URL(s3Endpoint(env, key));
  url.searchParams.set('uploads', '');

  const headers: Record<string, string> = {};
  if (contentType) headers['Content-Type'] = contentType;

  const signed = await s3.sign(
    new Request(url.toString(), { method: 'POST', headers }),
  );
  const res = await fetch(signed);
  if (!res.ok) throw new Error(`CreateMultipartUpload failed: ${res.status}`);

  const xml = await res.text();
  const parser = new XMLParser();
  const parsed = parser.parse(xml);
  return parsed.InitiateMultipartUploadResult.UploadId;
}

export async function s3CompleteMultipartUpload(
  s3: AwsClient,
  env: Env,
  key: string,
  uploadId: string,
  parts: Array<{ partNumber: number; etag: string }>,
) {
  const url = new URL(s3Endpoint(env, key));
  url.searchParams.set('uploadId', uploadId);

  const partsXml = parts
    .sort((a, b) => a.partNumber - b.partNumber)
    .map(
      (p) =>
        `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${p.etag}</ETag></Part>`,
    )
    .join('');
  const body = `<CompleteMultipartUpload>${partsXml}</CompleteMultipartUpload>`;

  const signed = await s3.sign(
    new Request(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body,
    }),
  );
  const res = await fetch(signed);
  if (!res.ok) {
    const respBody = await res.text();
    throw new Error(`CompleteMultipartUpload failed: ${res.status} ${respBody}`);
  }
}

export async function s3AbortMultipartUpload(
  s3: AwsClient,
  env: Env,
  key: string,
  uploadId: string,
) {
  const url = new URL(s3Endpoint(env, key));
  url.searchParams.set('uploadId', uploadId);

  const signed = await s3.sign(
    new Request(url.toString(), { method: 'DELETE' }),
  );
  const res = await fetch(signed);
  if (!res.ok) {
    // Ignore errors — might already be cleaned up
  }
}

export async function s3ListParts(
  s3: AwsClient,
  env: Env,
  key: string,
  uploadId: string,
): Promise<Array<{ partNumber: number; etag: string; size: number }>> {
  const url = new URL(s3Endpoint(env, key));
  url.searchParams.set('uploadId', uploadId);

  const signed = await s3.sign(
    new Request(url.toString(), { method: 'GET' }),
  );
  const res = await fetch(signed);
  if (!res.ok) return [];

  const xml = await res.text();
  const parser = new XMLParser();
  const parsed = parser.parse(xml);
  const rawParts = parsed?.ListPartsResult?.Part;
  if (!rawParts) return [];

  const partArray = Array.isArray(rawParts) ? rawParts : [rawParts];
  return partArray.map((p: any) => ({
    partNumber: Number(p.PartNumber),
    etag: String(p.ETag),
    size: Number(p.Size),
  }));
}
