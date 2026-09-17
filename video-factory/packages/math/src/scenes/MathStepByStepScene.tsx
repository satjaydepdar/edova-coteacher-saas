import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import type { SceneComponentProps } from '@video-factory/core';
import { SceneContainer, Card, FormulaDisplay, Callout, ProgressBar } from '@video-factory/core';
import type { MathStepByStepSceneNode } from '@video-factory/storyboard';

export const MathStepByStepScene: React.FC<SceneComponentProps<MathStepByStepSceneNode>> = ({
  scene,
  theme
}) => {
  const frame = useCurrentFrame();
  const interval = scene.activeStepFrameInterval ?? 45;
  const totalSteps = scene.steps.length;

  // Compute how many steps are currently revealed
  const currentStepIndex = Math.min(
    totalSteps - 1,
    Math.floor(frame / interval)
  );

  const progressFraction = (currentStepIndex + 1) / totalSteps;

  return (
    <SceneContainer
      theme={theme}
      badgeText="Worked Example"
      headerTitle={scene.title ?? 'Step-by-Step Derivation'}
      headerSubtitle={scene.subtitle ?? 'Follow each algebraic transformation carefully'}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '100%',
          maxWidth: '1100px'
        }}
      >
        {/* Starting Problem Equation Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: `${theme.colors.surface}cc`,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: `${theme.borderRadius / 2}px`,
            padding: '12px 28px'
          }}
        >
          <span style={{ fontSize: '18px', color: theme.colors.textMuted, fontWeight: 600 }}>
            Original Problem:
          </span>
          <FormulaDisplay
            theme={theme}
            latex={scene.problemLatex}
            fontSize={32}
            isBlock={false}
            style={{ margin: 0, padding: 0 }}
          />
        </div>

        {/* Progress indicator across steps */}
        <ProgressBar progress={progressFraction} theme={theme} height={6} />

        {/* The List of Sequential Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {scene.steps.map((step, idx) => {
            const isRevealed = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const stepStartFrame = idx * interval;

            const stepOpacity = interpolate(
              frame,
              [stepStartFrame, stepStartFrame + 10],
              [0, 1],
              {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp'
              }
            );

            if (!isRevealed) return null;

            return (
              <div
                key={step.stepNumber}
                style={{
                  opacity: stepOpacity,
                  transform: isCurrent ? 'scale(1.01)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Card
                  theme={theme}
                  variant={isCurrent ? 'highlight' : 'default'}
                  glowColor={isCurrent ? theme.colors.primary : undefined}
                  style={{
                    padding: '18px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isCurrent ? theme.colors.primary : `${theme.colors.border}88`,
                        color: theme.colors.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '16px'
                      }}
                    >
                      {step.stepNumber}
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: theme.colors.text }}>
                        {step.label}
                      </div>
                      {step.explanation && (
                        <div style={{ fontSize: '15px', color: theme.colors.textMuted, marginTop: '2px' }}>
                          {step.explanation}
                        </div>
                      )}
                    </div>
                  </div>

                  <FormulaDisplay
                    theme={theme}
                    latex={step.latex}
                    fontSize={28}
                    isBlock={false}
                    highlight={isCurrent}
                    highlightColor={theme.colors.secondary}
                  />
                </Card>
              </div>
            );
          })}
        </div>

        {/* Rule Callout if provided */}
        {scene.ruleCallout && (
          <Callout theme={theme} type="tip" title="Applied Rule">
            {scene.ruleCallout}
          </Callout>
        )}
      </div>
    </SceneContainer>
  );
};
