import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import type { Storyboard } from "@vf/storyboard";

/**
 * Calculates exact duration in seconds from a PCM WAV file header.
 */
export function getWavDuration(filePath: string): number {
  const buffer = fs.readFileSync(filePath);
  const fmtIndex = buffer.indexOf("fmt ");
  if (fmtIndex === -1) throw new Error(`Invalid WAV: fmt chunk not found in ${filePath}`);

  const numChannels = buffer.readUInt16LE(fmtIndex + 10);
  const sampleRate = buffer.readUInt32LE(fmtIndex + 12);
  const bitsPerSample = buffer.readUInt16LE(fmtIndex + 22);
  const blockAlign = (numChannels * bitsPerSample) / 8;

  const dataIndex = buffer.indexOf("data");
  if (dataIndex === -1) throw new Error(`Invalid WAV: data chunk not found in ${filePath}`);

  const dataSize = buffer.readUInt32LE(dataIndex + 4);
  const totalFrames = dataSize / blockAlign;
  return totalFrames / sampleRate;
}

/**
 * Synthesizes text to a WAV audio file using Windows native SpeechSynthesizer.
 * Returns the exact duration of the audio in seconds.
 */
export function synthesizeSpeechToWav(text: string, outputPath: string): number {
  const resolvedOut = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });

  // Sanitize text for PowerShell string
  const cleanText = text.replace(/'/g, "''").replace(/[\r\n]+/g, " ");

  const psScript = `
    Add-Type -AssemblyName System.Speech
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.SetOutputToWaveFile('${resolvedOut}')
    $synth.Speak('${cleanText}')
    $synth.Dispose()
  `;

  execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", psScript], {
    stdio: "pipe"
  });

  if (!fs.existsSync(resolvedOut)) {
    throw new Error(`Failed to generate WAV file at ${resolvedOut}`);
  }

  return getWavDuration(resolvedOut);
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

    const duration = synthesizeSpeechToWav(scene.narration, wavPath);
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
