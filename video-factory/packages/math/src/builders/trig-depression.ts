import { StoryboardSchema, type Storyboard } from "@vf/storyboard";

export interface TrigDepressionInput {
  question: string;
  bridgeHeightM: number;
  angleLeftDeg: number;
  angleRightDeg: number;
  narrationOverrides?: Record<string, string>;
}

export function buildTrigDepressionRiver(input?: Partial<TrigDepressionInput>): Storyboard {
  const h = input?.bridgeHeightM ?? 3;
  const a1 = input?.angleLeftDeg ?? 30;
  const a2 = input?.angleRightDeg ?? 45;

  const question =
    input?.question ??
    "From a point on a bridge across a river, the angles of depression of the banks on opposite sides of the river are 30° and 45°. If the bridge is at a height of 3 m from the banks, find the width of the river.";

  const lock = {
    "math.groups": "0.1.0",
    "math.trigDiagram": "0.1.0",
    "math.trigSteps": "0.1.0",
    "core.answer": "0.1.0",
  };

  const scenes = [
    {
      id: "s1",
      type: "math.groups",
      padMs: 400,
      narration:
        "From a bridge across a river, the angles of depression of the opposite banks are thirty degrees and forty-five degrees. The bridge is three meters high.",
      visual: {
        groups: [
          { label: "Bridge Height", n: h },
          { label: "Angle Bank A", n: a1 },
          { label: "Angle Bank B", n: a2 },
        ],
      },
    },
    {
      id: "s2",
      type: "math.trigDiagram",
      padMs: 500,
      narration:
        "The angles of depression are measured downward from the horizontal line of sight. By alternate interior angles, the angles at the river banks are thirty degrees and forty-five degrees.",
      visual: {
        title: "Geometric Model: Angles of Depression",
        heightM: h,
        angleLeftDeg: a1,
        angleRightDeg: a2,
        observerLabel: `Bridge (${h}m)`,
        leftLabel: `Bank A (${a1}°)`,
        rightLabel: `Bank B (${a2}°)`,
      },
    },
    {
      id: "s3",
      type: "math.trigSteps",
      padMs: 500,
      narration:
        "Using trigonometry in both right triangles: tangent thirty degrees gives d1 equals three root three meters. Tangent forty-five degrees gives d2 equals three meters.",
      visual: {
        title: "Applying Tangent Ratios to Both Banks",
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
      padMs: 600,
      narration:
        "Therefore, the total width of the river is three times root three plus one meters, which is approximately eight point two meters.",
      visual: {
        headline: "River Width = 3(√3 + 1) m",
        sub: "≈ 8.20 m · CBSE Class 10 NCERT Application of Trigonometry",
      },
    },
  ];

  return StoryboardSchema.parse({
    videoId: "trig-depression-river",
    title: "Angle of Depression: Width of River from a Bridge",
    template: "trig-depression",
    schemaVersion: "1.0",
    question,
    aspect: "16:9",
    fps: 30,
    scenes,
    componentLock: lock,
  });
}
