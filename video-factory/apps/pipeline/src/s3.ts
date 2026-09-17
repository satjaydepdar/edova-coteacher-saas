import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as path from "node:path";

// Mirrors backend/services/s3_client.py's bucket/region/prefix convention exactly,
// so both services write to the same place under the same "Ondemand videos/" folder.
const S3_BUCKET = process.env.EDOVA_S3_BUCKET || "innuxai-edova-coteacher";
const S3_REGION = process.env.EDOVA_S3_REGION || "ap-south-1";

let _client: S3Client | undefined;
function client(): S3Client {
  if (!_client) _client = new S3Client({ region: S3_REGION });
  return _client;
}

/** Uploads a finished on-demand video to S3 under "Ondemand videos/" and returns its key. */
export async function uploadOndemandVideo(fileName: string, data: Buffer): Promise<string> {
  const cleanName = path.basename(fileName);
  const key = `Ondemand videos/${cleanName.endsWith(".mp4") ? cleanName : `${cleanName}.mp4`}`;
  await client().send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: data,
      ContentType: "video/mp4",
    })
  );
  return key;
}
