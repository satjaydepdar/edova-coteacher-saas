import React from "react";
import { Sequence } from "remotion";
import { EstimatedKaraoke } from "@vf/core";

export interface SequenceIsolationProps {
  id: string;
  from: number;
  durationInFrames: number;
  narration?: string;
  children: React.ReactNode;
}

export const SequenceIsolation: React.FC<SequenceIsolationProps> = ({
  id,
  from,
  durationInFrames,
  narration,
  children,
}) => {
  return (
    <Sequence
      name={`Scene::${id}`}
      from={from}
      durationInFrames={durationInFrames}
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
    >
      {children}
      {narration && (
        <EstimatedKaraoke text={narration} durationInFrames={durationInFrames} />
      )}
    </Sequence>
  );
};
