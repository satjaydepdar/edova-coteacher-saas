export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface TypographyConfig {
  fontFamily: string;
  headingFontFamily?: string;
  codeFontFamily?: string;
  baseFontSize: number;
}

export interface ThemeConfig {
  name: string;
  colors: ColorPalette;
  typography: TypographyConfig;
  borderRadius: number;
  gradientBackground?: string;
}

export const DEFAULT_THEME: ThemeConfig = {
  name: 'edova-indigo',
  colors: {
    primary: '#4f46e5',
    secondary: '#06b6d4',
    accent: '#f59e0b',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#334155',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    headingFontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
    codeFontFamily: 'JetBrains Mono, Fira Code, monospace',
    baseFontSize: 24
  },
  borderRadius: 16,
  gradientBackground: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
};
