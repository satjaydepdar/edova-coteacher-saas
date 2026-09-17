import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const GROUP_COLORS = ["#f59e0b", "#38bdf8", "#a78bfa", "#f472b6", "#34d399"];

export const Pill: React.FC<{ label: string; highlight?: boolean; scale?: number; size?: number }> =
({ label, highlight, scale = 1, size = 60 }) => (
  <div style={{
    width: size, height: size * 0.72, borderRadius: 12, display: "grid", placeItems: "center",
    background: highlight ? "#dcfce7" : "#f1f5f9",
    border: `2.5px solid ${highlight ? "#16a34a" : "#cbd5e1"}`,
    color: highlight ? "#15803d" : "#64748b",
    fontSize: size * 0.42, fontWeight: 700, transform: `scale(${scale})`,
  }}>{label}</div>
);

export const Typed: React.FC<{ text: string; from: number; size?: number; color?: string }> =
({ text, from, size = 34, color = "#0f172a" }) => {
  const frame = useCurrentFrame();
  const k = text.length === 0 ? 1 : interpolate(
    frame,
    [from, Math.max(from + 1, from + text.length * 1.2)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <span style={{ fontSize: size, fontWeight: 700, color }}>{text.slice(0, Math.ceil(k * text.length))}</span>;
};

/** Scaffold captions: sliding window with clean background pill */
export const EstimatedKaraoke: React.FC<{ text: string; durationInFrames: number }> =
({ text, durationInFrames }) => {
  const frame = useCurrentFrame();
  const words = text.split(/\s+/).filter(Boolean);
  const activeIndex = Math.min(words.length - 1, Math.floor((frame / durationInFrames) * words.length));

  const windowSize = 9;
  const halfWindow = Math.floor(windowSize / 2);
  let start = Math.max(0, activeIndex - halfWindow);
  let end = Math.min(words.length, start + windowSize);
  if (end - start < windowSize) {
    start = Math.max(0, end - windowSize);
  }

  const visibleWords = words.slice(start, end);

  return (
    <div style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 24,
      display: "flex",
      justifyContent: "center",
      zIndex: 50,
      pointerEvents: "none",
    }}>
      <div style={{
        background: "rgba(15, 23, 42, 0.92)",
        backdropFilter: "blur(12px)",
        border: "1.5px solid rgba(148, 163, 184, 0.25)",
        borderRadius: 16,
        padding: "10px 24px",
        display: "flex",
        flexWrap: "nowrap",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.5)",
        maxWidth: 1350,
      }}>
        {visibleWords.map((w, idx) => {
          const globalIdx = start + idx;
          const isActive = globalIdx === activeIndex;
          const isPassed = globalIdx < activeIndex;
          return (
            <span
              key={globalIdx}
              style={{
                fontSize: 26,
                fontWeight: isActive ? 800 : 500,
                color: isActive ? "#38bdf8" : isPassed ? "#f1f5f9" : "#64748b",
                transform: isActive ? "scale(1.08)" : "scale(1)",
                whiteSpace: "nowrap",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
