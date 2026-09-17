import React from 'react';
import type { ThemeConfig } from '../contracts/theme.contract';

export interface CalloutProps {
  theme: ThemeConfig;
  title?: string;
  children: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'tip';
  style?: React.CSSProperties;
}

export const Callout: React.FC<CalloutProps> = ({
  theme,
  title,
  children,
  type = 'tip',
  style
}) => {
  const getTypeColor = () => {
    switch (type) {
      case 'info':
        return theme.colors.secondary;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'tip':
      default:
        return theme.colors.accent;
    }
  };

  const color = getTypeColor();

  return (
    <div
      style={{
        borderLeft: `4px solid ${color}`,
        backgroundColor: `${color}14`,
        borderRadius: `0 ${theme.borderRadius / 2}px ${theme.borderRadius / 2}px 0`,
        padding: '16px 24px',
        margin: '16px 0',
        width: '100%',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {title && (
        <div
          style={{
            fontWeight: 700,
            fontSize: '18px',
            color: color,
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          fontSize: '20px',
          lineHeight: '1.5',
          color: theme.colors.text
        }}
      >
        {children}
      </div>
    </div>
  );
};
