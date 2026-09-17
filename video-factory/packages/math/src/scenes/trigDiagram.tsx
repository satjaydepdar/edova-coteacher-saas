import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, interpolate } from "remotion";
import { z } from "zod";
import { defineScene, Pill } from "@vf/core";

export const TrigDiagramVisual = z.object({
  title: z.string(),
  heightM: z.number(),
  angleLeftDeg: z.number(),
  angleRightDeg: z.number(),
  observerLabel: z.string().default("Bridge (3m)"),
  leftLabel: z.string().default("Bank A"),
  rightLabel: z.string().default("Bank B"),
});

export const trigDiagram = defineScene({
  type: "math.trigDiagram",
  schema: TrigDiagramVisual,
  component: ({ visual, fps }) => {
    const frame = useCurrentFrame();

    const drawProgress = spring({
      frame,
      fps,
      config: { damping: 14 }
    });

    // Diagram geometry
    // Center top observer (bridge) at (960, 300)
    // River banks at ground y = 650
    // Bank A at x = 450, Bank B at x = 1470
    const obsX = 960;
    const obsY = 320;
    const groundY = 680;
    const bankAX = 440;
    const bankBX = 1480;

    const angleReveal = interpolate(frame, [15, 30], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <AbsoluteFill style={{
        background: "#0f172a",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px"
      }}>
        {/* Title */}
        <div style={{
          position: "absolute",
          top: 60,
          textAlign: "center",
          width: "100%"
        }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: "#f8fafc" }}>
            {visual.title}
          </div>
          <div style={{ fontSize: 24, color: "#94a3b8", marginTop: 8 }}>
            Angles of depression are measured downwards from the horizontal line of sight
          </div>
        </div>

        {/* SVG Geometric Layout */}
        <svg
          width="1920"
          height="1080"
          style={{ position: "absolute", inset: 0 }}
        >
          {/* Ground / Water surface */}
          <line
            x1="200"
            y1={groundY}
            x2="1720"
            y2={groundY}
            stroke="#38bdf8"
            strokeWidth="5"
            strokeDasharray="8 6"
          />

          {/* River Water Fill */}
          <rect
            x={bankAX}
            y={groundY}
            width={bankBX - bankAX}
            height="120"
            fill="#0284c718"
          />

          {/* Horizontal Line of Sight from Observer (Dashed yellow) */}
          <line
            x1="260"
            y1={obsY}
            x2="1660"
            y2={obsY}
            stroke="#f59e0b"
            strokeWidth="3.5"
            strokeDasharray="10 8"
            opacity={angleReveal}
          />

          {/* Vertical Height Line (Bridge to River Bed) */}
          <line
            x1={obsX}
            y1={obsY}
            x2={obsX}
            y2={groundY}
            stroke="#cbd5e1"
            strokeWidth="4"
          />

          {/* Line of Sight to Bank A */}
          <line
            x1={obsX}
            y1={obsY}
            x2={obsX - (obsX - bankAX) * drawProgress}
            y2={obsY + (groundY - obsY) * drawProgress}
            stroke="#a78bfa"
            strokeWidth="4.5"
          />

          {/* Line of Sight to Bank B */}
          <line
            x1={obsX}
            y1={obsY}
            x2={obsX + (bankBX - obsX) * drawProgress}
            y2={obsY + (groundY - obsY) * drawProgress}
            stroke="#34d399"
            strokeWidth="4.5"
          />

          {/* Depression Angle Arc Left (30°) */}
          <path
            d={`M ${obsX - 120} ${obsY} A 120 120 0 0 1 ${obsX - 100} ${obsY + 60}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3.5"
            opacity={angleReveal}
          />

          {/* Depression Angle Arc Right (45°) */}
          <path
            d={`M ${obsX + 120} ${obsY} A 120 120 0 0 0 ${obsX + 85} ${obsY + 85}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3.5"
            opacity={angleReveal}
          />

          {/* Alternate Interior Angle Arc at Bank A (30°) */}
          <path
            d={`M ${bankAX + 100} ${groundY} A 100 100 0 0 0 ${bankAX + 86} ${groundY - 50}`}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="3.5"
            opacity={angleReveal}
          />

          {/* Alternate Interior Angle Arc at Bank B (45°) */}
          <path
            d={`M ${bankBX - 90} ${groundY} A 90 90 0 0 1 ${bankBX - 64} ${groundY - 64}`}
            fill="none"
            stroke="#34d399"
            strokeWidth="3.5"
            opacity={angleReveal}
          />

          {/* Observer Point Dot */}
          <circle cx={obsX} cy={obsY} r="10" fill="#f59e0b" stroke="#ffffff" strokeWidth="3" />

          {/* Bank Points */}
          <circle cx={bankAX} cy={groundY} r="9" fill="#a78bfa" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx={bankBX} cy={groundY} r="9" fill="#34d399" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx={obsX} cy={groundY} r="6" fill="#94a3b8" />
        </svg>

        {/* Labels Overlay */}
        {/* Horizontal Line of sight tag */}
        <div style={{
          position: "absolute",
          top: obsY - 45,
          left: 360,
          color: "#f59e0b",
          fontSize: 22,
          fontWeight: 700,
          opacity: angleReveal
        }}>
          Horizontal Line of Sight
        </div>

        {/* Observer badge */}
        <div style={{
          position: "absolute",
          top: obsY - 70,
          left: obsX - 90,
          background: "#1e293b",
          border: "2px solid #f59e0b",
          borderRadius: 12,
          padding: "6px 16px",
          color: "#f8fafc",
          fontSize: 22,
          fontWeight: 700
        }}>
          {visual.observerLabel}
        </div>

        {/* Height label on vertical */}
        <div style={{
          position: "absolute",
          top: (obsY + groundY) / 2 - 20,
          left: obsX + 24,
          color: "#f8fafc",
          fontSize: 32,
          fontWeight: 800
        }}>
          h = {visual.heightM}m
        </div>

        {/* Angle 30° at observer */}
        <div style={{
          position: "absolute",
          top: obsY + 16,
          left: obsX - 220,
          color: "#f59e0b",
          fontSize: 28,
          fontWeight: 800,
          opacity: angleReveal
        }}>
          30°
        </div>

        {/* Angle 45° at observer */}
        <div style={{
          position: "absolute",
          top: obsY + 24,
          left: obsX + 160,
          color: "#f59e0b",
          fontSize: 28,
          fontWeight: 800,
          opacity: angleReveal
        }}>
          45°
        </div>

        {/* Bank A Label & Angle 30° */}
        <div style={{
          position: "absolute",
          top: groundY - 55,
          left: bankAX + 115,
          color: "#a78bfa",
          fontSize: 28,
          fontWeight: 800,
          opacity: angleReveal
        }}>
          30°
        </div>
        <div style={{
          position: "absolute",
          top: groundY + 20,
          left: bankAX - 50,
          color: "#a78bfa",
          fontSize: 26,
          fontWeight: 700
        }}>
          {visual.leftLabel}
        </div>

        {/* Bank B Label & Angle 45° */}
        <div style={{
          position: "absolute",
          top: groundY - 65,
          left: bankBX - 145,
          color: "#34d399",
          fontSize: 28,
          fontWeight: 800,
          opacity: angleReveal
        }}>
          45°
        </div>
        <div style={{
          position: "absolute",
          top: groundY + 20,
          left: bankBX - 30,
          color: "#34d399",
          fontSize: 26,
          fontWeight: 700
        }}>
          {visual.rightLabel}
        </div>

        {/* River Width Span Indicator */}
        <div style={{
          position: "absolute",
          top: groundY + 65,
          left: (bankAX + bankBX) / 2 - 160,
          background: "#0284c728",
          border: "2px solid #38bdf8",
          borderRadius: 14,
          padding: "10px 24px",
          color: "#38bdf8",
          fontSize: 26,
          fontWeight: 800
        }}>
          Width = d₁ + d₂
        </div>
      </AbsoluteFill>
    );
  },
});
