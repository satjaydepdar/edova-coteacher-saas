import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import type { ThemeConfig } from '../contracts/theme.contract';

export interface AnimatedCounterProps {
  from?: number;
  to: number;
  startFrame?: number;
  durationInFrames?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  theme: ThemeConfig;
  style?: React.CSSProperties;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from = 0,
  to,
  startFrame = 0,
  durationInFrames = 30,
  decimals = 0,
  prefix = '',
  suffix = '',
  theme,
  style
}) => {
  let frame = 0;
  try {
    frame = useCurrentFrame();
  } catch {
    frame = startFrame + durationInFrames;
  }

  const currentVal = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [from, to],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    }
  );

  return (
    <span
      style={{
        fontFamily: theme.typography.codeFontFamily ?? 'monospace',
        fontWeight: 800,
        color: theme.colors.accent,
        fontVariantNumeric: 'tabular-nums',
        ...style
      }}
    >
      {prefix}
      {currentVal.toFixed(decimals)}
      {suffix}
    </span>
  );
};
