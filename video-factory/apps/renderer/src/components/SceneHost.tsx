import React from "react";
import type { Scene } from "@vf/storyboard";
import type { SceneRegistry } from "@vf/core";

export interface SceneHostProps {
  scene: Scene;
  registry: SceneRegistry;
  durationInFrames: number;
  fps: number;
}

export const SceneHost: React.FC<SceneHostProps> = ({
  scene,
  registry,
  durationInFrames,
  fps
}) => {
  const sceneDef = registry[scene.type];

  if (!sceneDef) {
    return (
      <div style={{
        width: "100%",
        height: "100%",
        background: "#1e1e24",
        color: "#ef4444",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
        padding: 40,
        textAlign: "center"
      }}>
        <h2>[SceneHost Error] Unregistered Scene Type</h2>
        <p>No scene component is registered for type: <code>"{scene.type}"</code></p>
      </div>
    );
  }

  // Validate visual payload at render time against the scene schema
  const parsedVisual = sceneDef.schema.parse(scene.visual);
  const Component = sceneDef.component;

  return (
    <Component
      visual={parsedVisual}
      durationInFrames={durationInFrames}
      fps={fps}
    />
  );
};
