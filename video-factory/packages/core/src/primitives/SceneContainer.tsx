import React from 'react';
import type { ThemeConfig } from '../contracts/theme.contract';

export interface SceneContainerProps {
  theme: ThemeConfig;
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  badgeText?: string;
  showWatermark?: boolean;
  watermarkText?: string;
  style?: React.CSSProperties;
}

export const SceneContainer: React.FC<SceneContainerProps> = ({
  theme,
  children,
  headerTitle,
  headerSubtitle,
  badgeText,
  showWatermark = true,
  watermarkText = 'Edova CoTeacher',
  style
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        background: theme.gradientBackground ?? theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily,
        position: 'relative',
        overflow: 'hidden',
        padding: '60px 80px',
        ...style
      }}
    >
      {/* Top Header Section */}
      {(headerTitle || badgeText) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
            borderBottom: `1px solid ${theme.colors.border}`,
            paddingBottom: '20px'
          }}
        >
          <div>
            {badgeText && (
              <span
                style={{
                  display: 'inline-block',
                  background: `${theme.colors.primary}33`,
                  color: theme.colors.secondary,
                  border: `1px solid ${theme.colors.primary}66`,
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  fontSize: '16px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '10px'
                }}
              >
                {badgeText}
              </span>
            )}
            {headerTitle && (
              <h1
                style={{
                  margin: 0,
                  fontSize: '44px',
                  fontWeight: 800,
                  fontFamily: theme.typography.headingFontFamily ?? theme.typography.fontFamily,
                  color: theme.colors.text,
                  letterSpacing: '-0.02em'
                }}
              >
                {headerTitle}
              </h1>
            )}
            {headerSubtitle && (
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '22px',
                  color: theme.colors.textMuted
                }}
              >
                {headerSubtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Scene Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          position: 'relative',
          zIndex: 1
        }}
      >
        {children}
      </div>

      {/* Subtle Bottom Watermark */}
      {showWatermark && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '40px',
            fontSize: '15px',
            color: theme.colors.textMuted,
            opacity: 0.6,
            fontWeight: 500,
            letterSpacing: '0.05em'
          }}
        >
          {watermarkText}
        </div>
      )}
    </div>
  );
};
