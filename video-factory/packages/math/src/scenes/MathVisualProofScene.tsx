import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SceneComponentProps } from '@video-factory/core';
import { SceneContainer, Card, FormulaDisplay } from '@video-factory/core';
import type { MathVisualProofSceneNode } from '@video-factory/storyboard';
import { mathToSvgCoords } from '../utils/coordinate.utils';

export const MathVisualProofScene: React.FC<SceneComponentProps<MathVisualProofSceneNode>> = ({
  scene,
  theme
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const diagramProgress = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 80
    }
  });

  const svgWidth = 560;
  const svgHeight = 360;
  const bounds = {
    minX: -5,
    maxX: 5,
    minY: -5,
    maxY: 5,
    width: svgWidth,
    height: svgHeight,
    padding: 30
  };

  const centerCoords = mathToSvgCoords(0, 0, bounds);

  return (
    <SceneContainer
      theme={theme}
      badgeText="Visual Proof"
      headerTitle={scene.proofTitle}
      headerSubtitle="Geometric and graphical intuition"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          gap: '36px',
          width: '100%',
          maxWidth: '1150px',
          alignItems: 'center'
        }}
      >
        {/* Left: Theorem & Explanations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card theme={theme} variant="glass">
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: theme.colors.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}
            >
              Theorem Statement
            </div>
            <FormulaDisplay
              theme={theme}
              latex={scene.theoremLatex}
              fontSize={38}
              highlight={true}
              highlightColor={theme.colors.accent}
            />
          </Card>

          {scene.caption && (
            <div
              style={{
                backgroundColor: `${theme.colors.surface}88`,
                borderLeft: `4px solid ${theme.colors.secondary}`,
                padding: '16px 20px',
                borderRadius: '4px',
                fontSize: '18px',
                lineHeight: '1.6',
                color: theme.colors.textMuted
              }}
            >
              {scene.caption}
            </div>
          )}
        </div>

        {/* Right: Animated SVG Canvas Diagram */}
        <Card
          theme={theme}
          variant="elevated"
          glowColor={theme.colors.secondary}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px'
          }}
        >
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ overflow: 'visible' }}
          >
            {/* Grid Axes */}
            <line
              x1={bounds.padding}
              y1={centerCoords.svgY}
              x2={svgWidth - bounds.padding}
              y2={centerCoords.svgY}
              stroke={theme.colors.border}
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <line
              x1={centerCoords.svgX}
              y1={bounds.padding}
              x2={centerCoords.svgX}
              y2={svgHeight - bounds.padding}
              stroke={theme.colors.border}
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Geometric Diagram representation */}
            {scene.diagramType === 'geometric_box' && (
              <g opacity={diagramProgress}>
                {/* Area model box */}
                <rect
                  x="80"
                  y="60"
                  width={240 * diagramProgress}
                  height={220 * diagramProgress}
                  fill={`${theme.colors.primary}33`}
                  stroke={theme.colors.primary}
                  strokeWidth="3"
                  rx="8"
                />
                <rect
                  x="330"
                  y="60"
                  width={140 * diagramProgress}
                  height={220 * diagramProgress}
                  fill={`${theme.colors.secondary}33`}
                  stroke={theme.colors.secondary}
                  strokeWidth="3"
                  rx="8"
                />
                <text x="190" y="180" fill={theme.colors.text} fontSize="22" fontWeight="bold" textAnchor="middle">
                  Area A
                </text>
                <text x="400" y="180" fill={theme.colors.text} fontSize="22" fontWeight="bold" textAnchor="middle">
                  Area B
                </text>
              </g>
            )}

            {scene.diagramType !== 'geometric_box' && (
              <g opacity={diagramProgress}>
                {/* Vector / Slope Line */}
                <line
                  x1="90"
                  y1="280"
                  x2={90 + 380 * diagramProgress}
                  y2={280 - 200 * diagramProgress}
                  stroke={theme.colors.accent}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Slope triangle */}
                <line
                  x1="90"
                  y1="280"
                  x2={90 + 380 * diagramProgress}
                  y2="280"
                  stroke={theme.colors.primary}
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                />
                <line
                  x1={90 + 380 * diagramProgress}
                  y1="280"
                  x2={90 + 380 * diagramProgress}
                  y2={280 - 200 * diagramProgress}
                  stroke={theme.colors.secondary}
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                />
              </g>
            )}

            {/* Custom Plotted Points */}
            {scene.points.map((pt, i) => {
              const { svgX, svgY } = mathToSvgCoords(pt.x, pt.y, bounds);
              return (
                <g key={i} opacity={interpolate(frame, [15 + i * 5, 25 + i * 5], [0, 1], { extrapolateRight: 'clamp' })}>
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r="8"
                    fill={pt.color ?? theme.colors.accent}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {pt.label && (
                    <text
                      x={svgX + 12}
                      y={svgY - 12}
                      fill={theme.colors.text}
                      fontSize="16"
                      fontWeight="bold"
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </Card>
      </div>
    </SceneContainer>
  );
};
