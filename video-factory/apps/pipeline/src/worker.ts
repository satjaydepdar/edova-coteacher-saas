import { Worker } from "bullmq";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { StoryboardSchema, type Storyboard } from "@vf/storyboard";

const connection = { host: process.env.REDIS_HOST ?? "localhost", port: 6379 };

async function run(job: any, name: string, fn: () => Promise<void> | void) {
  await job.updateProgress({ step: name });
  console.log(`[${job.id}] > ${name}`);
  await fn();
}

// TTS stub — replaced by azure.ts (word timestamps) in the next increment
async function synthAll(videoId: string, sb: Storyboard): Promise<Record<string, number>> {
  const dir = `apps/renderer/public/assets/${videoId}`;
  if (!existsSync(dir)) { console.log(`  no wavs for ${videoId} — silent preview mode`); return {}; }
  const durations: Record<string, number> = {};
  for (const s of sb.scenes) {
    const f = `${dir}/${s.id}.wav`;
    if (existsSync(f)) durations[s.id] = parseFloat(execFileSync("ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());
  }
  return durations;
}

new Worker("videos", async (job) => {
  const { videoId } = job.data as { videoId: string };
  const sb = StoryboardSchema.parse(JSON.parse(readFileSync(`storyboards/${videoId}.json`, "utf8")));

  await run(job, "tts+plan", async () => {
    const audioDurations = await synthAll(videoId, sb);
    writeFileSync(`storyboards/${videoId}.props.json`,
      JSON.stringify({ storyboard: sb, audioDurations }));
  });

  await run(job, "render", () => {
    execFileSync("npx", ["remotion", "render", "apps/renderer/src/index.ts", "Explainer",
      `out/${videoId}.mp4`, `--props=storyboards/${videoId}.props.json`], { stdio: "inherit" });
  });

  await run(job, "qc+publish", async () => {
    // TODO: loudnorm -16 LUFS, ffprobe A/V gate (<200ms), thumbnail, S3 upload, DB row
    console.log(`  done: out/${videoId}.mp4`);
  });
}, { connection, concurrency: 2 });
