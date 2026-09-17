export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null,
};

export const POSTGRES_CONFIG = {
  host: process.env.POSTGRES_HOST || "127.0.0.1",
  port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
  user: process.env.POSTGRES_USER || "vf",
  password: process.env.POSTGRES_PASSWORD || "vf",
  database: process.env.POSTGRES_DB || "videofactory",
};

export const MINIO_CONFIG = {
  endPoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
  port: parseInt(process.env.MINIO_PORT || "9000", 10),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ROOT_USER || "vf",
  secretKey: process.env.MINIO_ROOT_PASSWORD || "vfsecret",
  bucket: process.env.MINIO_BUCKET || "videos",
};

export const QUEUE_NAME = process.env.QUEUE_NAME || "vf-render-queue";
