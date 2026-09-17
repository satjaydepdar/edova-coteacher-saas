import React from 'react';
import type { ThemeConfig } from '../contracts/theme.contract';

export interface HighlightTextProps {
  children: React.ReactNode;
  theme: ThemeConfig;
  variant?: 'badge' | 'glow' | 'underline';
  color?: string;
  style?: React.CSSProperties;
}

export const HighlightText: React.FC<HighlightTextProps> = ({
  children,
  theme,
  variant = 'badge',
  color,
  style
}) => {
  const highlightColor = color ?? theme.colors.accent;

  if (variant === 'badge') {
    return (
      <span
        style={{
          display: 'inline-block',
          backgroundColor: `${highlightColor}25`,
          color: highlightColor,
          padding: '2px 10px',
          borderRadius: '6px',
          fontWeight: 700,
          border: `1px solid ${highlightColor}55`,
          ...style
        }}
      >
        {children}
      </span>
    );
  }

  if (variant === 'underline') {
    return (
      <span
        style={{
          textDecoration: 'underline',
          textDecorationColor: highlightColor,
          textDecorationThickness: '3px',
          textUnderlineOffset: '6px',
          fontWeight: 700,
          color: theme.colors.text,
          ...style
        }}
      >
        {children}
      </span>
    );
  }

  // variant === 'glow'
  return (
    <span
      style={{
        color: highlightColor,
        fontWeight: 800,
        textShadow: `0 0 20px ${highlightColor}88`,
        ...style
      }}
    >
      {children}
    </span>
  );
};
