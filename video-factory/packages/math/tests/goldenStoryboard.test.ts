import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { StoryboardSchema } from "@vf/storyboard";
import { MathStoryboardBuilder } from "../src/builder";

describe("Golden Storyboard Verification", () => {
  const fixturePath = path.resolve(__dirname, "../../../storyboards/factor-pairs-v1.json");

  it("fixture factor-pairs-v1.json strictly conforms to StoryboardSchema", () => {
    expect(fs.existsSync(fixturePath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
    const parsed = StoryboardSchema.safeParse(content);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.scenes).toHaveLength(5);
      expect(parsed.data.scenes[0].type).toBe("math.factorPills");
      expect(parsed.data.scenes[4].type).toBe("core.answer");
    }
  });

  it("MathStoryboardBuilder builds matching storyboard structure", () => {
    const builder = new MathStoryboardBuilder("math-factors-12", "Finding Factors of 12");
    builder
      .setQuestion("What are all the positive integer factors of 12?")
      .setAspect("16:9")
      .setFps(30)
      .addFactorPills("scene-1", "Intro to factors", {
        title: "Factors of 12",
        expression: "12 = a × b",
        factors: [{ label: "1" }, { label: "2" }, { label: "3" }, { label: "4" }, { label: "6" }, { label: "12" }],
      })
      .addAnswer("scene-2", "Answer recap", {
        headline: "Factors: 1, 2, 3, 4, 6, 12",
        sub: "6 distinct factors",
      });

    const storyboard = builder.build();
    expect(storyboard.videoId).toBe("math-factors-12");
    expect(storyboard.scenes).toHaveLength(2);
    expect(storyboard.scenes[0].type).toBe("math.factorPills");
    expect(storyboard.scenes[1].type).toBe("core.answer");
  });
});
