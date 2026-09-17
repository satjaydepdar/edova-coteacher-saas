import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SceneComponentProps } from '@video-factory/core';
import { SceneContainer, Card, FormulaDisplay, HighlightText } from '@video-factory/core';
import type { MathConceptIntroSceneNode } from '@video-factory/storyboard';

export const MathConceptIntroScene: React.FC<SceneComponentProps<MathConceptIntroSceneNode>> = ({
  scene,
  theme
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring animation for main card
  const scale = spring({
    frame,
    fps,
    config: {
      damping: 14,
      stiffness: 90
    }
  });

  const questionOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const formulaTranslateY = interpolate(frame, [0, 20], [30, 0], {
    extrapolateRight: 'clamp'
  });

  return (
    <SceneContainer
      theme={theme}
      badgeText={scene.badgeText ?? 'Mathematics'}
      headerTitle={scene.title ?? scene.conceptName}
      headerSubtitle={scene.subtitle ?? 'Intuitive Concept Introduction'}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
          maxWidth: '1000px',
          width: '100%'
        }}
      >
        {/* Main concept showcase card */}
        <div style={{ transform: `scale(${scale})`, width: '100%' }}>
          <Card
            theme={theme}
            variant="glass"
            glowColor={theme.colors.primary}
            style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px 48px'
            }}
          >
            <div
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: theme.colors.textMuted,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '10px'
              }}
            >
              Today's Key Focus
            </div>

            <div
              style={{
                fontSize: '44px',
                fontWeight: 800,
                color: theme.colors.text,
                marginBottom: '20px'
              }}
            >
              {scene.conceptName}
            </div>

            {scene.hookLatex && (
              <div
                style={{
                  transform: `translateY(${formulaTranslateY}px)`,
                  width: '100%',
                  margin: '10px 0'
                }}
              >
                <FormulaDisplay
                  theme={theme}
                  latex={scene.hookLatex}
                  fontSize={52}
                  highlight={true}
                  highlightColor={theme.colors.secondary}
                />
              </div>
            )}

            {scene.contextDescription && (
              <p
                style={{
                  fontSize: '22px',
                  color: theme.colors.textMuted,
                  lineHeight: '1.6',
                  maxWidth: '800px',
                  margin: '16px 0 0 0'
                }}
              >
                {scene.contextDescription}
              </p>
            )}
          </Card>
        </div>

        {/* The Question / Problem to be solved */}
        <div
          style={{
            opacity: questionOpacity,
            width: '100%',
            backgroundColor: `${theme.colors.surface}dd`,
            border: `1.5px solid ${theme.colors.primary}88`,
            borderRadius: `${theme.borderRadius}px`,
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}
        >
          <HighlightText theme={theme} variant="badge" color={theme.colors.accent}>
            CHALLENGE
          </HighlightText>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: theme.colors.text,
              flex: 1
            }}
          >
            {scene.questionPrompt}
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};
