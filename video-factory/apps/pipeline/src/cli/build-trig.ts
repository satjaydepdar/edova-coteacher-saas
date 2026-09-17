import { writeFileSync, mkdirSync } from "node:fs";
import { buildTrigDepressionRiver } from "../../../../packages/math/src/builders/trig-depression";
import { synthesizeStoryboard } from "../tts";

async function main() {
  const sb = buildTrigDepressionRiver();

  mkdirSync("storyboards", { recursive: true });
  writeFileSync(`storyboards/${sb.videoId}.json`, JSON.stringify(sb, null, 2));
  console.log(`wrote storyboards/${sb.videoId}.json (${sb.scenes.length} scenes)`);

  // Generate voice narration audio files for all scenes
  const durations = await synthesizeStoryboard(sb);

  console.log("Audio durations map for Trig Video:", durations);
}

main().catch(err => {
  console.error("Error building Trig storyboard:", err);
  process.exit(1);
});
