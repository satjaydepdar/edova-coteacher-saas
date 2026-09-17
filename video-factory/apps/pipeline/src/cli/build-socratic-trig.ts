import * as fs from "node:fs";
import * as path from "node:path";
import { spawn } from "node:child_process";
import { StoryboardSchema, type Storyboard } from "@vf/storyboard";
import { synthesizeStoryboard } from "../tts";

async function main() {
  const videoId = "trig-socratic-demo";
  console.log(`🎬 Building Socratic Tutoring Video: ${videoId}...`);

  const storyboardData: Storyboard = {
    videoId,
    title: "Socratic Method: Measuring River Width from a Bridge",
    template: "trig-depression",
    schemaVersion: "1.0",
    question: "From a point on a bridge across a river, the angles of depression of the banks on opposite sides of the river are 30° and 45°. If the bridge is at a height of 3 m from the banks, find the width of the river.",
    aspect: "16:9",
    fps: 30,
    scenes: [
      {
        id: "s1",
        type: "math.groups",
        padMs: 600,
        narration:
          "Let us explore this problem step by step. We are standing on a bridge, three meters above a river, looking down at two opposite banks at angles of depression of thirty degrees and forty-five degrees. Our goal is to determine the exact total width of the river without measuring across the water.",
        visual: {
          groups: [
            { label: "Bridge Height (Opposite)", n: 3 },
            { label: "Depression Angle Bank A", n: 30 },
            { label: "Depression Angle Bank B", n: 45 },
          ],
        },
      },
      {
        id: "s2",
        type: "math.trigDiagram",
        padMs: 700,
        narration:
          "First, how do we correctly model the angles of depression? A common student error is measuring the angle from the vertical bridge pillar. In reality, the angle of depression is always measured downward from the observer's horizontal eye-level. Because the horizontal line of sight and the ground water level are parallel lines, alternate interior angles guarantee that the angles at Bank A and Bank B are thirty degrees and forty-five degrees.",
        visual: {
          title: "Socratic Model: Angles of Depression & Parallel Lines",
          heightM: 3,
          angleLeftDeg: 30,
          angleRightDeg: 45,
          observerLabel: "Bridge Observer (3m)",
          leftLabel: "Bank A (30° via alternate angles)",
          rightLabel: "Bank B (45° via alternate angles)",
        },
      },
      {
        id: "s3",
        type: "math.trigSteps",
        padMs: 800,
        narration:
          "Now, why do we use the tangent ratio? In both right-angled triangles, we know the perpendicular height of three meters, and we need the horizontal distance along the riverbed. Since tangent equals opposite over adjacent, tangent connects our known height to our unknown ground distances. For Bank A, tangent of thirty degrees equals three over d1, which simplifies to d1 equals three root three meters, or about 5.2 meters. For Bank B, tangent of forty-five degrees equals three over d2, giving d2 equals exactly three meters.",
        visual: {
          title: "The 'Why' Behind Tangent & Step-by-Step Derivation",
          leftEquation: "tan(30°) = 3 / d₁",
          leftResult: "d₁ = 3√3 ≈ 5.20 m",
          rightEquation: "tan(45°) = 3 / d₂",
          rightResult: "d₂ = 3.00 m",
          totalEquation: "Width = d₁ + d₂ = 3√3 + 3",
          totalResult: "3(√3 + 1) m ≈ 8.20 m",
        },
      },
      {
        id: "s4",
        type: "core.answer",
        padMs: 800,
        narration:
          "To conclude, we add the two segments: three root three plus three meters. Factoring out three gives three times root three plus one meters, which is approximately eight point two meters. Both segments are positive and geometrically consistent with our visual diagram. That is the complete Socratic derivation.",
        visual: {
          headline: "Total River Width = 3(√3 + 1) m ≈ 8.20 m",
          sub: "Sanity Verified: d₁ (5.20m) + d₂ (3.00m) = 8.20m Across Both Banks",
        },
      },
    ],
    componentLock: {
      "math.groups": "0.1.0",
      "math.trigDiagram": "0.1.0",
      "math.trigSteps": "0.1.0",
      "core.answer": "0.1.0",
    },
  };

  const validated = StoryboardSchema.parse(storyboardData);

  // Note: __dirname is video-factory/apps/pipeline/src/cli -> 4 levels up to video-factory root
  const rootDir = path.resolve(__dirname, "../../../..");
  const storyboardsDir = path.resolve(rootDir, "storyboards");
  const rendererDir = path.resolve(rootDir, "apps/renderer");
  const outDir = path.resolve(rendererDir, "out");

  fs.mkdirSync(storyboardsDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  const sbFile = path.resolve(storyboardsDir, `${videoId}.json`);
  fs.writeFileSync(sbFile, JSON.stringify(validated, null, 2), "utf-8");
  console.log(`✅ Saved Storyboard: ${sbFile}`);

  // Synthesize voice narration
  console.log("🎙️ Synthesizing Socratic voice audio narration...");
  const baseAssetsDir = path.resolve(rendererDir, "public/assets");
  const durations = await synthesizeStoryboard(validated, baseAssetsDir);
  console.log("Audio Durations:", durations);

  // Render MP4 with Remotion
  console.log("🎥 Starting Remotion render...");
  const propsRelative = `../../storyboards/${videoId}.props.json`;
  const outFileName = `${videoId}.mp4`;
  const outPath = path.resolve(outDir, outFileName);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      "npx.cmd",
      ["remotion", "render", "src/index.ts", "Explainer", `out/${outFileName}`, `--props=${propsRelative}`],
      {
        cwd: rendererDir,
        stdio: "inherit",
        shell: true,
      }
    );

    child.on("close", (code) => {
      if (code === 0 && fs.existsSync(outPath)) {
        console.log(`\n🎉 Success! Rendered Socratic Video to: ${outPath}`);
        resolve();
      } else {
        reject(new Error(`Remotion render exited with code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

main().catch((err) => {
  console.error("❌ Failed to generate Socratic video:", err);
  process.exit(1);
});
