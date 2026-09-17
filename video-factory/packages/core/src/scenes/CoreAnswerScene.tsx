import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SceneComponentProps } from '../contracts/scene.contract';
import { SceneContainer } from '../primitives/SceneContainer';
import { Card } from '../primitives/Card';
import { FormulaDisplay } from '../primitives/FormulaDisplay';
import { HighlightText } from '../primitives/HighlightText';
import { Callout } from '../primitives/Callout';

export interface CoreAnswerSceneData {
  id: string;
  type: 'core.answer';
  title?: string;
  subtitle?: string;
  answerLabel?: string;
  answerLatex?: string;
  answerText?: string;
  explanation?: string;
  takeaways?: string[];
  verificationNote?: string;
}

export const CoreAnswerScene: React.FC<SceneComponentProps<CoreAnswerSceneData>> = ({
  scene,
  theme
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring animation for the answer card
  const cardScale = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
      mass: 0.8
    }
  });

  const cardOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp'
  });

  // Takeaways reveal animation
  const takeawaysOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <SceneContainer
      theme={theme}
      badgeText="Final Solution"
      headerTitle={scene.title ?? 'Final Result & Recap'}
      headerSubtitle={scene.subtitle ?? 'Key takeaways and conclusion'}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          width: '100%',
          maxWidth: '1000px'
        }}
      >
        {/* Solution Showcase Card */}
        <div
          style={{
            transform: `scale(${cardScale})`,
            opacity: cardOpacity,
            width: '100%'
          }}
        >
          <Card
            theme={theme}
            variant="highlight"
            glowColor={theme.colors.success}
            style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '36px 48px'
            }}
          >
            <HighlightText theme={theme} variant="badge" color={theme.colors.success}>
              {scene.answerLabel ?? 'VERIFIED ANSWER'}
            </HighlightText>

            {scene.answerLatex && (
              <FormulaDisplay
                theme={theme}
                latex={scene.answerLatex}
                fontSize={56}
                highlight={true}
                highlightColor={theme.colors.success}
                style={{ margin: '20px 0' }}
              />
            )}

            {scene.answerText && (
              <div
                style={{
                  fontSize: '38px',
                  fontWeight: 800,
                  color: theme.colors.text,
                  marginTop: '12px'
                }}
              >
                {scene.answerText}
              </div>
            )}

            {scene.explanation && (
              <p
                style={{
                  fontSize: '20px',
                  color: theme.colors.textMuted,
                  maxWidth: '750px',
                  margin: '12px 0 0 0',
                  lineHeight: '1.5'
                }}
              >
                {scene.explanation}
              </p>
            )}
          </Card>
        </div>

        {/* Recap & Takeaways */}
        {scene.takeaways && scene.takeaways.length > 0 && (
          <div
            style={{
              opacity: takeawaysOpacity,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: theme.colors.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '4px'
              }}
            >
              Summary Takeaways:
            </div>
            {scene.takeaways.map((point, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  backgroundColor: `${theme.colors.surface}cc`,
                  border: `1px solid ${theme.colors.border}`,
                  padding: '14px 20px',
                  borderRadius: `${theme.borderRadius / 2}px`,
                  fontSize: '19px',
                  color: theme.colors.text
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: `${theme.colors.primary}33`,
                    color: theme.colors.secondary,
                    fontWeight: 700,
                    fontSize: '14px'
                  }}
                >
                  {idx + 1}
                </span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        )}

        {/* Verification Note Callout */}
        {scene.verificationNote && (
          <div style={{ width: '100%', opacity: takeawaysOpacity }}>
            <Callout theme={theme} type="success" title="Check & Verification">
              {scene.verificationNote}
            </Callout>
          </div>
        )}
      </div>
    </SceneContainer>
  );
};
