import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function generatePresignedPutUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function deleteS3Object(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
  });
  return s3Client.send(command);
}
