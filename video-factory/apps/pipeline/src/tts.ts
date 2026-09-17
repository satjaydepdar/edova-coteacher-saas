import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import * as fs from "node:fs";
import * as path from "node:path";
import type { Storyboard } from "@vf/storyboard";

const POLLY_REGION = process.env.EDOVA_S3_REGION || process.env.AWS_REGION || "ap-south-1";
const POLLY_VOICE = process.env.EDOVA_POLLY_VOICE || "Joanna";
const PCM_SAMPLE_RATE = 16000; // Polly's max rate for OutputFormat=pcm
const PCM_CHANNELS = 1;
const PCM_BITS_PER_SAMPLE = 16;

let _client: PollyClient | undefined;
function client(): PollyClient {
  if (!_client) _client = new PollyClient({ region: POLLY_REGION });
  return _client;
}

/** Wraps raw 16-bit PCM audio in a standard 44-byte WAV header (RIFF/WAVE, PCM format). */
function pcmToWav(pcm: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/**
 * Synthesizes text to a WAV audio file using Amazon Polly (raw PCM, wrapped in a WAV
 * header). Runs anywhere the AWS SDK can reach Polly -- no local OS speech engine needed,
 * unlike the previous Windows-only System.Speech implementation.
 * Returns the exact duration of the audio in seconds.
 */
export async function synthesizeSpeechToWav(text: string, outputPath: string): Promise<number> {
  const resolvedOut = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });

  const cleanText = text.replace(/[\r\n]+/g, " ").trim();
  const res = await client().send(
    new SynthesizeSpeechCommand({
      Text: cleanText,
      OutputFormat: "pcm",
      SampleRate: String(PCM_SAMPLE_RATE),
      VoiceId: POLLY_VOICE as any,
      Engine: "neural",
    })
  );

  if (!res.AudioStream) throw new Error(`Polly returned no audio for: "${cleanText.slice(0, 60)}..."`);
  const pcm = Buffer.from(await res.AudioStream.transformToByteArray());
  const wav = pcmToWav(pcm, PCM_SAMPLE_RATE, PCM_CHANNELS, PCM_BITS_PER_SAMPLE);
  fs.writeFileSync(resolvedOut, wav);

  const bytesPerSample = PCM_BITS_PER_SAMPLE / 8;
  return pcm.length / (PCM_SAMPLE_RATE * PCM_CHANNELS * bytesPerSample);
}

/**
 * Synthesizes voice narration for all scenes in a storyboard,
 * saves WAV files to `apps/renderer/public/assets/${storyboard.videoId}/${scene.id}.wav`,
 * and updates `${storyboard.videoId}.props.json` with audioDurations.
 */
export async function synthesizeStoryboard(
  storyboard: Storyboard,
  baseOutputDir = "apps/renderer/public/assets"
): Promise<Record<string, number>> {
  const videoAssetsDir = path.resolve(baseOutputDir, storyboard.videoId);
  fs.mkdirSync(videoAssetsDir, { recursive: true });

  const durations: Record<string, number> = {};
  console.log(`\n🎙️  Synthesizing voice narration for "${storyboard.title}" (${storyboard.scenes.length} scenes)...`);

  for (const scene of storyboard.scenes) {
    const wavPath = path.join(videoAssetsDir, `${scene.id}.wav`);
    console.log(`   ▶ [${scene.id}] "${scene.narration}"`);

    const duration = await synthesizeSpeechToWav(scene.narration, wavPath);
    durations[scene.id] = parseFloat(duration.toFixed(2));
    console.log(`     ✓ Created ${path.basename(wavPath)} (${durations[scene.id]}s)`);
  }

  // Update props.json for Remotion renderer
  const propsPath = path.resolve("storyboards", `${storyboard.videoId}.props.json`);
  fs.writeFileSync(
    propsPath,
    JSON.stringify({ storyboard, audioDurations: durations }, null, 2),
    "utf-8"
  );
  console.log(`\n✅ Voice narration complete. Updated ${propsPath} with audio durations.\n`);

  return durations;
}
