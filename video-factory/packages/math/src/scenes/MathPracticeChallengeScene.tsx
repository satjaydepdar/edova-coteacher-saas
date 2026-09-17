import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SceneComponentProps } from '@video-factory/core';
import { SceneContainer, Card, FormulaDisplay, HighlightText, Callout } from '@video-factory/core';
import type { MathPracticeChallengeSceneNode } from '@video-factory/storyboard';

export const MathPracticeChallengeScene: React.FC<SceneComponentProps<MathPracticeChallengeSceneNode>> = ({
  scene,
  theme
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalCountdownFrames = (scene.countdownSeconds ?? 5) * fps;
  const remainingSeconds = Math.max(
    0,
    Math.ceil((totalCountdownFrames - frame) / fps)
  );

  const timerProgress = interpolate(frame, [0, totalCountdownFrames], [1, 0], {
    extrapolateRight: 'clamp'
  });

  const isTimerFinished = remainingSeconds === 0;

  return (
    <SceneContainer
      theme={theme}
      badgeText="Quick Challenge"
      headerTitle="Test Your Understanding"
      headerSubtitle="Try to solve before the timer runs out!"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px',
          width: '100%',
          maxWidth: '1000px'
        }}
      >
        {/* Challenge Prompt Card */}
        <Card
          theme={theme}
          variant="glass"
          glowColor={theme.colors.accent}
          style={{
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '36px 40px'
          }}
        >
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: theme.colors.text,
              marginBottom: '16px'
            }}
          >
            {scene.promptQuestion}
          </div>

          {scene.problemLatex && (
            <FormulaDisplay
              theme={theme}
              latex={scene.problemLatex}
              fontSize={44}
              highlight={true}
              highlightColor={theme.colors.accent}
            />
          )}

          {/* Countdown Clock */}
          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <div
              style={{
                fontSize: '48px',
                fontWeight: 800,
                fontFamily: theme.typography.codeFontFamily ?? 'monospace',
                color: isTimerFinished ? theme.colors.success : theme.colors.accent
              }}
            >
              {isTimerFinished ? 'TIME UP!' : `00:0${remainingSeconds}`}
            </div>

            {/* Countdown radial bar */}
            <div
              style={{
                width: '280px',
                height: '8px',
                backgroundColor: `${theme.colors.border}88`,
                borderRadius: '9999px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${timerProgress * 100}%`,
                  height: '100%',
                  backgroundColor: isTimerFinished ? theme.colors.success : theme.colors.accent,
                  transition: 'width 0.1s linear'
                }}
              />
            </div>
          </div>
        </Card>

        {/* Multiple choice options if provided */}
        {scene.options && scene.options.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              width: '100%'
            }}
          >
            {scene.options.map(opt => {
              const showAnswer = isTimerFinished && opt.isCorrect;
              return (
                <div
                  key={opt.id}
                  style={{
                    backgroundColor: showAnswer ? `${theme.colors.success}33` : `${theme.colors.surface}cc`,
                    border: `2px solid ${showAnswer ? theme.colors.success : theme.colors.border}`,
                    borderRadius: `${theme.borderRadius / 2}px`,
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '22px',
                    fontWeight: 600,
                    color: theme.colors.text,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span>{opt.label}</span>
                  {showAnswer && (
                    <HighlightText theme={theme} variant="badge" color={theme.colors.success}>
                      CORRECT
                    </HighlightText>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Hint Callout */}
        {scene.hint && (
          <div style={{ width: '100%' }}>
            <Callout theme={theme} type="info" title="Hint">
              {scene.hint}
            </Callout>
          </div>
        )}
      </div>
    </SceneContainer>
  );
};
