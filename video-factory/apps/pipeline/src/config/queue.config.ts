import type { ConnectionOptions } from 'bullmq';
import type { Storyboard } from '@video-factory/storyboard';

export const QUEUE_NAME = process.env.QUEUE_NAME || 'video-render-queue';

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};

export interface RenderJobData {
  jobId: string;
  storyboard: Storyboard;
  outputPath?: string;
  options?: {
    codec?: 'h264' | 'h265' | 'vp8' | 'vp9';
    audioCodec?: 'aac' | 'mp3';
    crf?: number;
    concurrency?: number;
  };
}

export interface RenderJobResult {
  jobId: string;
  outputPath: string;
  fileSizeBytes: number;
  durationInSeconds: number;
  renderedAt: string;
}
