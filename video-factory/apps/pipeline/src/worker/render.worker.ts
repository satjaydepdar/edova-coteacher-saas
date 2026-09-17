import { Worker, Job, Queue } from "bullmq";
import * as path from "node:path";
import * as fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { StoryboardSchema, type Storyboard } from "@vf/storyboard";
import { REDIS_CONFIG, QUEUE_NAME } from "../config/env.config";

export interface RenderJobPayload {
  storyboard: Storyboard;
  outputPath?: string;
  audioDurationsSec?: Record<string, number>;
}

export function createRenderQueue(): Queue<RenderJobPayload> {
  return new Queue<RenderJobPayload>(QUEUE_NAME, {
    connection: REDIS_CONFIG,
  });
}

export function startRenderWorker(): Worker<RenderJobPayload> {
  const outputDir = path.resolve(process.cwd(), "out");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`[VF Worker] Listening on queue "${QUEUE_NAME}"...`);

  const worker = new Worker<RenderJobPayload>(
    QUEUE_NAME,
    async (job: Job<RenderJobPayload>) => {
      console.log(`[VF Worker] Processing Job ${job.id} ("${job.data.storyboard.title}")...`);

      // 1. Validate incoming storyboard
      const storyboard = StoryboardSchema.parse(job.data.storyboard);
      const targetPath = job.data.outputPath || path.join(outputDir, `${storyboard.videoId}.mp4`);

      // 2. Bundle Remotion Root Composition
      const entryPoint = path.resolve(__dirname, "../../../renderer/src/index.ts");
      const bundled = await bundle({ entryPoint });

      // 3. Select Composition
      const composition = await selectComposition({
        serveUrl: bundled,
        id: "VideoComposition",
        inputProps: {
          storyboard,
          audioDurationsSec: job.data.audioDurationsSec,
        },
      });

      // 4. Render media to MP4
      await renderMedia({
        composition,
        serveUrl: bundled,
        codec: "h264",
        outputLocation: targetPath,
        inputProps: {
          storyboard,
          audioDurationsSec: job.data.audioDurationsSec,
        },
        onProgress: ({ renderedFrames, encodedFrames }) => {
          const progress = Math.round((encodedFrames / composition.durationInFrames) * 100);
          job.updateProgress(progress);
        },
      });

      console.log(`[VF Worker] Rendered: ${targetPath}`);
      return { outputPath: targetPath };
    },
    { connection: REDIS_CONFIG }
  );

  return worker;
}

if (require.main === module) {
  startRenderWorker();
}
