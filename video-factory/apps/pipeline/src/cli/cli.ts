#!/usr/bin/env node
import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import { StoryboardSchema } from "@vf/storyboard";
import { MathStoryboardBuilder } from "@vf/math";
import { createRenderQueue, startRenderWorker } from "../worker/render.worker";

const program = new Command();

program
  .name("vf")
  .description("Video Factory CLI: Storyboard validator, generator, and render pipeline runner")
  .version("1.0.0");

// 1. Validate Command
program
  .command("validate")
  .description("Validate a storyboard JSON file against StoryboardSchema")
  .argument("<storyboardPath>", "Path to storyboard JSON")
  .action((storyboardPath: string) => {
    const fullPath = path.resolve(process.cwd(), storyboardPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`[Error] File not found: ${fullPath}`);
      process.exit(1);
    }

    try {
      const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      const result = StoryboardSchema.safeParse(raw);

      if (result.success) {
        console.log(`\x1b[32m✔ Storyboard is valid!\x1b[0m`);
        console.log(`  Video ID: ${result.data.videoId}`);
        console.log(`  Title: "${result.data.title}"`);
        console.log(`  Scenes: ${result.data.scenes.length}`);
        console.log(`  Aspect: ${result.data.aspect} @ ${result.data.fps}fps`);
      } else {
        console.error(`\x1b[31m✖ Storyboard validation failed:\x1b[0m`);
        console.error(result.error.format());
        process.exit(1);
      }
    } catch (err: any) {
      console.error(`[Error] Parsing JSON failed:`, err.message);
      process.exit(1);
    }
  });

// 2. Queue Command
program
  .command("queue")
  .description("Enqueue a storyboard render job into BullMQ")
  .argument("<storyboardPath>", "Path to storyboard JSON")
  .action(async (storyboardPath: string) => {
    const fullPath = path.resolve(process.cwd(), storyboardPath);
    const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    const storyboard = StoryboardSchema.parse(raw);

    const queue = createRenderQueue();
    const job = await queue.add("render", { storyboard });
    console.log(`\x1b[32m✔ Job enqueued successfully!\x1b[0m Job ID: ${job.id}`);
    await queue.close();
    process.exit(0);
  });

// 3. Worker Command
program
  .command("worker")
  .description("Start the BullMQ background video render worker")
  .action(() => {
    startRenderWorker();
  });

// 4. Generate Sample Command
program
  .command("generate-sample")
  .description("Generate sample storyboard via MathStoryboardBuilder")
  .option("-o, --output <path>", "Destination path", "storyboards/generated-sample.json")
  .action((options: { output: string }) => {
    const builder = new MathStoryboardBuilder("math-factors-12", "Finding Factors of 12");
    builder
      .setQuestion("What are all the positive integer factors of 12?")
      .setAspect("16:9")
      .setFps(30)
      .addFactorPills("scene-1", "Let's find all the numbers that divide twelve evenly.", {
        title: "Factors of 12",
        expression: "12 = a × b",
        factors: [{ label: "1" }, { label: "2" }, { label: "3" }, { label: "4" }, { label: "6" }, { label: "12" }],
        note: "A factor divides without leaving a remainder.",
      })
      .addStepByStep("scene-2", "We can pair them up systematically.", {
        problem: "Factor Pairs of 12",
        steps: [
          { label: "Pair 1", equation: "1 × 12 = 12" },
          { label: "Pair 2", equation: "2 × 6 = 12" },
          { label: "Pair 3", equation: "3 × 4 = 12" },
        ],
      })
      .addAnswer("scene-3", "Here are all the factors of twelve.", {
        headline: "Factors: 1, 2, 3, 4, 6, 12",
        sub: "Total of 6 distinct factors in 3 factor pairs.",
      });

    const storyboard = builder.build();
    const dest = path.resolve(process.cwd(), options.output);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, JSON.stringify(storyboard, null, 2), "utf-8");
    console.log(`\x1b[32m✔ Generated sample storyboard at:\x1b[0m ${dest}`);
  });

program.parse(process.argv);
