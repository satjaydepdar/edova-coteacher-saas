import React from 'react';
import type { ThemeConfig } from '../contracts/theme.contract';

export interface CardProps {
  theme: ThemeConfig;
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'highlight' | 'glass';
  style?: React.CSSProperties;
  className?: string;
  glowColor?: string;
}

export const Card: React.FC<CardProps> = ({
  theme,
  children,
  variant = 'default',
  style,
  glowColor
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated':
        return theme.colors.surface;
      case 'highlight':
        return `${theme.colors.primary}18`;
      case 'glass':
        return 'rgba(30, 41, 59, 0.7)';
      default:
        return theme.colors.surface;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'highlight':
        return theme.colors.primary;
      default:
        return theme.colors.border;
    }
  };

  const glowShadow = glowColor
    ? `0 0 35px ${glowColor}33, 0 10px 30px rgba(0, 0, 0, 0.3)`
    : '0 10px 30px rgba(0, 0, 0, 0.35)';

  return (
    <div
      style={{
        backgroundColor: getBackgroundColor(),
        border: `1.5px solid ${getBorderColor()}`,
        borderRadius: `${theme.borderRadius}px`,
        boxShadow: glowShadow,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '36px 40px',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
        ...style
      }}
    >
      {children}
    </div>
  );
};
