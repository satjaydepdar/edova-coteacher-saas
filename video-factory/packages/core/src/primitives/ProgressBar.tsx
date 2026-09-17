import React from 'react';
import type { ThemeConfig } from '../contracts/theme.contract';

export interface ProgressBarProps {
  progress: number; // 0 to 1
  theme: ThemeConfig;
  height?: number;
  barColor?: string;
  backgroundColor?: string;
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  theme,
  height = 8,
  barColor,
  backgroundColor,
  style
}) => {
  const clamped = Math.max(0, Math.min(1, progress));
  const activeColor = barColor ?? theme.colors.primary;

  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        backgroundColor: backgroundColor ?? `${theme.colors.border}66`,
        borderRadius: '9999px',
        overflow: 'hidden',
        position: 'relative',
        ...style
      }}
    >
      <div
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: activeColor,
          borderRadius: '9999px',
          boxShadow: `0 0 10px ${activeColor}88`,
          transition: 'width 0.1s linear'
        }}
      />
    </div>
  );
};
