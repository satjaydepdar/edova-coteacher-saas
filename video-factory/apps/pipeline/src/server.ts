import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawn } from "node:child_process";
import { buildTrigDepressionRiver } from "../../../packages/math/src/builders/trig-depression";
import { buildHcfMaxSeating } from "../../../packages/math/src/builders/hcf-max-seating";
import { synthesizeStoryboard } from "./tts";
import type { Storyboard } from "@vf/storyboard";

export interface JobState {
  id: string;
  videoId: string;
  status: "QUEUED" | "SYNTHESIZING_AUDIO" | "RENDERING_VIDEO" | "READY" | "FAILED";
  progress: number; // 0 - 100
  currentStage: string;
  error?: string;
  videoUrl?: string;
  storyboard?: Storyboard;
  createdAt: number;
  completedAt?: number;
}

const JOBS = new Map<string, JobState>();
const VIDEO_ID_TO_JOB = new Map<string, string>();

const PORT = parseInt(process.env.ENGINE_PORT || process.env.PORT || "5050", 10);
const ROOT_DIR = path.resolve(__dirname, "../../..");
const RENDERER_DIR = path.resolve(ROOT_DIR, "apps/renderer");
const OUT_DIR = path.resolve(RENDERER_DIR, "out");
const STORYBOARDS_DIR = path.resolve(ROOT_DIR, "storyboards");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(STORYBOARDS_DIR, { recursive: true });

function computeVideoId(problemType: string, params: Record<string, any>): string {
  if (problemType === "trig-depression") {
    const h = params.bridgeHeightM ?? 3;
    const a1 = params.angleLeftDeg ?? 30;
    const a2 = params.angleRightDeg ?? 45;
    return `trig-depression-h${h}-a${a1}-b${a2}`;
  }
  if (problemType === "hcf-max-seating") {
    const a = params.hindi ?? 60;
    const b = params.english ?? 84;
    const c = params.maths ?? 108;
    return `hcf-${a}-${b}-${c}`;
  }
  return `custom-${Date.now()}`;
}

async function runOnDemandPipeline(job: JobState, problemType: string, params: Record<string, any>, question?: string) {
  try {
    // 1. Build Storyboard
    job.status = "QUEUED";
    job.progress = 5;
    job.currentStage = "Assembling dynamic storyboard";

    let sb: Storyboard;
    if (problemType === "hcf-max-seating") {
      sb = buildHcfMaxSeating();
    } else {
      // Default to trig-depression
      sb = buildTrigDepressionRiver({
        videoId: job.videoId,
        question: question,
        bridgeHeightM: params.bridgeHeightM ? Number(params.bridgeHeightM) : undefined,
        angleLeftDeg: params.angleLeftDeg ? Number(params.angleLeftDeg) : undefined,
        angleRightDeg: params.angleRightDeg ? Number(params.angleRightDeg) : undefined,
      });
    }

    job.storyboard = sb;
    const sbPath = path.resolve(STORYBOARDS_DIR, `${job.videoId}.json`);
    fs.writeFileSync(sbPath, JSON.stringify(sb, null, 2), "utf-8");

    // 2. Synthesize Voice Narration
    job.status = "SYNTHESIZING_AUDIO";
    job.progress = 20;
    job.currentStage = "Synthesizing voice narration for scenes";

    const baseAssetsDir = path.resolve(RENDERER_DIR, "public/assets");
    await synthesizeStoryboard(sb, baseAssetsDir);

    job.progress = 40;
    job.status = "RENDERING_VIDEO";
    job.currentStage = "Rendering 1080p canvas with Remotion";

    // 3. Remotion Video Render
    const propsRelative = `../../storyboards/${job.videoId}.props.json`;
    const outFileName = `${job.videoId}.mp4`;
    const outPath = path.resolve(OUT_DIR, outFileName);

    await new Promise<void>((resolve, reject) => {
      // Execute remotion render
      const cmd = "cmd.exe";
      const args = [
        "/d",
        "/s",
        "/c",
        `npx remotion render src/index.ts Explainer out/${outFileName} --props=${propsRelative}`
      ];

      const child = spawn(cmd, args, {
        cwd: RENDERER_DIR,
        stdio: ["ignore", "pipe", "pipe"],
      });

      child.stdout.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        // Look for progress like "Rendered 650/1300"
        const match = text.match(/Rendered\s+(\d+)\/(\d+)/i);
        if (match) {
          const current = parseInt(match[1], 10);
          const total = parseInt(match[2], 10);
          const renderPct = Math.round((current / total) * 55); // 40% -> 95%
          job.progress = Math.min(95, 40 + renderPct);
          job.currentStage = `Rendering frames: ${current}/${total}`;
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        // Remotion logs warnings or progress
      });

      child.on("close", (code) => {
        if (code === 0 && fs.existsSync(outPath)) {
          resolve();
        } else {
          reject(new Error(`Remotion exited with code ${code}`));
        }
      });

      child.on("error", (err) => {
        reject(err);
      });
    });

    job.status = "READY";
    job.progress = 100;
    job.currentStage = "Video ready for playback";
    job.videoUrl = `/api/v1/video/${job.videoId}`;
    job.completedAt = Date.now();
  } catch (err: any) {
    console.error(`[Pipeline Error for ${job.videoId}]:`, err);
    job.status = "FAILED";
    job.error = err?.message || "Video generation failed";
    job.currentStage = "Generation failed";
  }
}

function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  // GET /health
  if (pathname === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", engine: "video-factory", version: "1.0.0", port: PORT }));
    return;
  }

  // POST /api/v1/generate
  if (pathname === "/api/v1/generate" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const problemType = payload.problemType || "trig-depression";
      const params = payload.parameters || {};
      const question = payload.question;
      const forceRefresh = Boolean(payload.forceRefresh);

      // Deterministic video ID
      const videoId = payload.videoId || computeVideoId(problemType, params);
      const mp4Path = path.resolve(OUT_DIR, `${videoId}.mp4`);

      // 1. Check if already exists and not forceRefresh
      if (fs.existsSync(mp4Path) && !forceRefresh) {
        let sb: Storyboard | undefined;
        const sbPath = path.resolve(STORYBOARDS_DIR, `${videoId}.json`);
        if (fs.existsSync(sbPath)) {
          try {
            sb = JSON.parse(fs.readFileSync(sbPath, "utf-8"));
          } catch {}
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          jobId: `cached-${videoId}`,
          videoId,
          status: "READY",
          progress: 100,
          cached: true,
          videoUrl: `/api/v1/video/${videoId}`,
          storyboard: sb,
        }));
        return;
      }

      // 2. Check if a job is already in progress
      const existingJobId = VIDEO_ID_TO_JOB.get(videoId);
      if (existingJobId && JOBS.has(existingJobId)) {
        const existingJob = JOBS.get(existingJobId)!;
        if (existingJob.status !== "FAILED") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(existingJob));
          return;
        }
      }

      // 3. Create new On-Demand Job
      const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newJob: JobState = {
        id: jobId,
        videoId,
        status: "QUEUED",
        progress: 0,
        currentStage: "Queued for generation",
        createdAt: Date.now(),
      };

      JOBS.set(jobId, newJob);
      VIDEO_ID_TO_JOB.set(videoId, jobId);

      // Trigger pipeline asynchronously
      runOnDemandPipeline(newJob, problemType, params, question);

      res.writeHead(202, { "Content-Type": "application/json" });
      res.end(JSON.stringify(newJob));
    } catch (err: any) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err?.message || "Invalid request payload" }));
    }
    return;
  }

  // GET /api/v1/jobs/:jobId
  if (pathname.startsWith("/api/v1/jobs/") && req.method === "GET") {
    const jobId = pathname.replace("/api/v1/jobs/", "");
    const job = JOBS.get(jobId);
    if (!job) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Job not found" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(job));
    return;
  }

  // GET /api/v1/storyboard/:videoId
  if (pathname.startsWith("/api/v1/storyboard/") && req.method === "GET") {
    const vid = pathname.replace("/api/v1/storyboard/", "");
    const sbPath = path.resolve(STORYBOARDS_DIR, `${vid}.json`);
    if (!fs.existsSync(sbPath)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Storyboard not found" }));
      return;
    }
    const data = fs.readFileSync(sbPath, "utf-8");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(data);
    return;
  }

  // GET or HEAD /api/v1/video/:videoId (Seekable MP4 Streaming)
  if (pathname.startsWith("/api/v1/video/") && (req.method === "GET" || req.method === "HEAD")) {
    const rawVid = pathname.replace("/api/v1/video/", "");
    const vid = rawVid.endsWith(".mp4") ? rawVid.slice(0, -4) : rawVid;
    const mp4Path = path.resolve(OUT_DIR, `${vid}.mp4`);

    if (!fs.existsSync(mp4Path)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Video ${vid}.mp4 not found` }));
      return;
    }

    const stat = fs.statSync(mp4Path);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (req.method === "HEAD") {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
      });
      res.end();
      return;
    }

    if (range) {
      // Partial content (HTTP 206)
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const stream = fs.createReadStream(mp4Path, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
      });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
      });
      fs.createReadStream(mp4Path).pipe(res);
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Video Generation Pipeline Engine listening on :${PORT}`);
  console.log(`   Health:     http://localhost:${PORT}/health`);
  console.log(`   Generate:   POST http://localhost:${PORT}/api/v1/generate`);
  console.log(`   Video Dir:  ${OUT_DIR}`);
  console.log(`======================================================\n`);
});
