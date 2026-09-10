import React, { useState } from 'react'
import SocraticSplitLayout from '../components/SocraticSplitLayout'
import { BlockProps } from '../types'

export default function AngleAroundPointBlock({ json, onEvent }: BlockProps) {
  const [angle1, setAngle1] = useState(120)
  const [angle2, setAngle2] = useState(150)
  const angle3 = 360 - angle1 - angle2

  const liveObservation = `Angles ∠1 = <b>${angle1}°</b> and ∠2 = <b>${angle2}°</b> leave remaining <b>∠3 = ${angle3}°</b> to complete the full <b>360° turn ✓</b>`

  return (
    <SocraticSplitLayout
      json={json}
      blockId={json?.id || 'angles-around-point-1'}
      blockType="angles"
      blockState={{ angle1, angle2, angle3 }}
      liveObservation={liveObservation}
      initialHint="Angles around a central vertex must sum to <b>360°</b>. Adjust Angle 1 and Angle 2 to see how the remaining angle is determined!"
      topicTitle="Welcome to Geometry & Trigonometry"
      topicSubtitle="Angles Around a Central Point"
      prompt={
        json?.content?.prompt ||
        'Angles around a point must sum to 360°. Adjust Angle 1 and Angle 2 to determine Angle 3.'
      }
      progressPercent={55}
      points={70}
      quickQuestions={[
        'Why is the full turn 360 degrees?',
        'How do we solve for the missing angle?',
        'Can an angle around a point exceed 180 degrees?'
      ]}
      onEvent={onEvent}
    >
      <div className="w-full flex flex-col items-center justify-center space-y-6">
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <div className="flex items-center justify-between text-xs font-mono">
            <span>Angle 1:</span>
            <input
              type="range"
              min={10}
              max={200}
              value={angle1}
              onChange={(e) => setAngle1(parseInt(e.target.value, 10))}
              className="w-40"
            />
            <span className="text-[#d4ff3a] font-bold">{angle1}°</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span>Angle 2:</span>
            <input
              type="range"
              min={10}
              max={200}
              value={angle2}
              onChange={(e) => setAngle2(parseInt(e.target.value, 10))}
              className="w-40"
            />
            <span className="text-[#d4ff3a] font-bold">{angle2}°</span>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-zinc-700 rounded-xl px-6 py-4 flex items-center gap-4 text-xs font-mono shadow-inner">
          <span>∠1: {angle1}°</span>
          <span>+</span>
          <span>∠2: {angle2}°</span>
          <span>+</span>
          <span className="text-[#d4ff3a] font-bold">∠3 (Remaining): {angle3}°</span>
          <span>= 360°</span>
        </div>
      </div>
    </SocraticSplitLayout>
  )
}
