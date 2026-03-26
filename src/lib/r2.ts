import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { envServer } from "@/lib/env.server";

function getR2Client() {
  if (!envServer.r2AccountId || !envServer.r2AccessKeyId || !envServer.r2SecretAccessKey) {
    throw new Error("Missing R2 env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${envServer.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: envServer.r2AccessKeyId,
      secretAccessKey: envServer.r2SecretAccessKey
    }
  });
}

export function r2PublicUrlForKey(key: string) {
  if (!envServer.r2PublicBaseUrl) return null;
  const base = envServer.r2PublicBaseUrl.replace(/\/+$/, "");
  return `${base}/${encodeURI(key).replace(/%2F/g, "/")}`;
}

export async function createPresignedPutUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}) {
  if (!envServer.r2Bucket) throw new Error("Missing R2 env var: R2_BUCKET");
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: envServer.r2Bucket,
    Key: params.key,
    ContentType: params.contentType
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds ?? 60
  });

  return url;
}

export async function createPresignedGetUrl(params: {
  key: string;
  expiresInSeconds?: number;
}) {
  if (!envServer.r2Bucket) throw new Error("Missing R2 env var: R2_BUCKET");
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: envServer.r2Bucket,
    Key: params.key
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds ?? 60
  });

  return url;
}
