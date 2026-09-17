import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, interpolate } from "remotion";
import { z } from "zod";
import { defineScene, Pill } from "@vf/core";

export const TrigStepsVisual = z.object({
  title: z.string().default("Calculating River Width"),
  leftEquation: z.string(),
  leftResult: z.string(),
  rightEquation: z.string(),
  rightResult: z.string(),
  totalEquation: z.string(),
  totalResult: z.string(),
});

export const trigSteps = defineScene({
  type: "math.trigSteps",
  schema: TrigStepsVisual,
  component: ({ visual, fps }) => {
    const frame = useCurrentFrame();

    const s1 = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 14 } });
    const s2 = spring({ frame: Math.max(0, frame - 50), fps, config: { damping: 14 } });
    const s3 = spring({ frame: Math.max(0, frame - 100), fps, config: { damping: 14 } });

    return (
      <AbsoluteFill style={{
        background: "#0f172a",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "50px 80px 120px 80px",
        gap: 24
      }}>
        {/* Title */}
        <div style={{ fontSize: 38, fontWeight: 800, color: "#f8fafc", textAlign: "center", marginBottom: 4 }}>
          {visual.title}
        </div>

        {/* Two Triangles Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 28,
          width: "100%",
          maxWidth: 1250
        }}>
          {/* Left Bank Triangle (30°) */}
          <div style={{
            transform: `scale(${s1})`,
            background: "#1e293b",
            border: "3px solid #a78bfa",
            borderRadius: 20,
            padding: "24px 32px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#a78bfa", marginBottom: 12 }}>
              In Right Δ (Bank A · 30°)
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", fontFamily: "monospace", whiteSpace: "nowrap" }}>
              {visual.leftEquation}
            </div>
            <div style={{
              marginTop: 14,
              fontSize: 30,
              fontWeight: 800,
              color: "#38bdf8",
              fontFamily: "monospace",
              background: "#38bdf818",
              padding: "8px 16px",
              borderRadius: 12,
              whiteSpace: "nowrap"
            }}>
              {visual.leftResult}
            </div>
          </div>

          {/* Right Bank Triangle (45°) */}
          <div style={{
            transform: `scale(${s2})`,
            background: "#1e293b",
            border: "3px solid #34d399",
            borderRadius: 20,
            padding: "24px 32px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#34d399", marginBottom: 12 }}>
              In Right Δ (Bank B · 45°)
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", fontFamily: "monospace", whiteSpace: "nowrap" }}>
              {visual.rightEquation}
            </div>
            <div style={{
              marginTop: 14,
              fontSize: 30,
              fontWeight: 800,
              color: "#34d399",
              fontFamily: "monospace",
              background: "#34d39918",
              padding: "8px 16px",
              borderRadius: 12,
              whiteSpace: "nowrap"
            }}>
              {visual.rightResult}
            </div>
          </div>
        </div>

        {/* Total River Width Combine Card */}
        <div style={{
          transform: `scale(${s3})`,
          width: "100%",
          maxWidth: 1250,
          background: "#064e3b",
          border: "4px solid #4ade80",
          borderRadius: 20,
          padding: "20px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#a7f3d0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Width of River (AB)
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#f8fafc", marginTop: 4, whiteSpace: "nowrap" }}>
              {visual.totalEquation}
            </div>
          </div>
          <div style={{
            fontSize: 40,
            fontWeight: 900,
            color: "#d1fae5",
            fontFamily: "monospace",
            whiteSpace: "nowrap"
          }}>
            {visual.totalResult}
          </div>
        </div>
      </AbsoluteFill>
    );
  },
});
