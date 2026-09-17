import React, { useMemo } from 'react';
import katex from 'katex';
import type { ThemeConfig } from '../contracts/theme.contract';

export interface FormulaDisplayProps {
  latex: string;
  theme: ThemeConfig;
  fontSize?: number | string;
  isBlock?: boolean;
  highlight?: boolean;
  highlightColor?: string;
  style?: React.CSSProperties;
}

export const FormulaDisplay: React.FC<FormulaDisplayProps> = ({
  latex,
  theme,
  fontSize = 36,
  isBlock = true,
  highlight = false,
  highlightColor,
  style
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: isBlock,
        throwOnError: false,
        output: 'html'
      });
    } catch {
      return `<span style="color: #ef4444;">${latex}</span>`;
    }
  }, [latex, isBlock]);

  const activeColor = highlightColor ?? theme.colors.secondary;

  return (
    <div
      style={{
        display: isBlock ? 'block' : 'inline-block',
        fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
        color: highlight ? activeColor : theme.colors.text,
        textAlign: 'center',
        padding: isBlock ? '16px 24px' : '4px 8px',
        margin: isBlock ? '12px 0' : '0 4px',
        borderRadius: `${theme.borderRadius / 2}px`,
        backgroundColor: highlight ? `${activeColor}15` : 'transparent',
        border: highlight ? `2px solid ${activeColor}` : '2px solid transparent',
        transition: 'all 0.3s ease',
        ...style
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
