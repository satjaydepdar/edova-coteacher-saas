import { writeFileSync, mkdirSync } from "node:fs";
import { buildHcfMaxSeating } from "@vf/math";
import { synthesizeStoryboard } from "../tts";

async function main() {
  const groups = [
    { label: "Hindi", n: 60 }, { label: "English", n: 84 }, { label: "Maths", n: 108 },
  ];

  const sb = buildHcfMaxSeating({
    question: "CASE STUDY 2 — seminar participants; maximum per room (a)14 (b)12 (c)16 (d)18",
    groups,
    answerOption: "b",
  });

  mkdirSync("storyboards", { recursive: true });
  writeFileSync(`storyboards/${sb.videoId}.json`, JSON.stringify(sb, null, 2));
  console.log(`wrote storyboards/${sb.videoId}.json (${sb.scenes.length} scenes)`);

  // Generate voice narration audio files for all scenes
  const durations = await synthesizeStoryboard(sb);

  console.log("Audio durations map:", durations);
}

main().catch(err => {
  console.error("Error building storyboard with voice:", err);
  process.exit(1);
});
