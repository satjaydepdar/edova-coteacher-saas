import React, { useState } from 'react'
import SocraticSplitLayout from '../components/SocraticSplitLayout'
import { BlockProps } from '../types'

export default function ProjectileBlock({ json, onEvent }: BlockProps) {
  const [angle, setAngle] = useState(45)
  const velocity = 20
  const g = 9.81
  const rad = (angle * Math.PI) / 180
  const range = ((velocity * velocity * Math.sin(2 * rad)) / g).toFixed(1)
  const maxHeight = ((velocity * velocity * Math.sin(rad) * Math.sin(rad)) / (2 * g)).toFixed(1)

  const isMax = angle === 45
  const liveObservation = isMax
    ? `Optimal launch angle reached! At <b>45°</b>, horizontal range is maximized at <b>${range} m ★</b>.`
    : `At launch angle <b>${angle}°</b>, horizontal range is <b>${range} m</b> and apex height is <b>${maxHeight} m</b>. Try setting angle to 45° to maximize range!`

  return (
    <SocraticSplitLayout
      json={json}
      blockId={json?.id || 'projectile-block-1'}
      blockType="projectile"
      blockState={{ angle, velocity, range, maxHeight, isMax }}
      liveObservation={liveObservation}
      initialHint="Launch velocity is 20 m/s. Adjust the <b>Launch Angle</b> slider on the right to discover which angle yields the maximum horizontal range!"
      topicTitle="Welcome to Physics & Mechanics"
      topicSubtitle="2D Kinematics and Projectile Motion"
      prompt={
        json?.content?.prompt ||
        'Launch velocity is 20 m/s. Adjust the launch angle to maximize horizontal range.'
      }
      progressPercent={60}
      points={85}
      quickQuestions={[
        'Why does 45 degrees maximize range?',
        'How does launch angle affect max height?',
        'What formula calculates time of flight?'
      ]}
      onEvent={onEvent}
    >
      <div className="w-full flex flex-col items-center justify-center space-y-6">
        <div className="flex justify-center items-center gap-4 py-2">
          <label className="text-xs text-zinc-400 font-mono">Launch Angle:</label>
          <input
            type="range"
            min={0}
            max={90}
            value={angle}
            onChange={(e) => setAngle(parseInt(e.target.value, 10))}
            className="w-56"
          />
          <span className="font-mono text-[#d4ff3a] font-bold text-lg">{angle}°</span>
        </div>

        <div className="w-full flex justify-around bg-[#1a1a1a] border border-zinc-700 rounded-xl p-4 text-xs font-mono shadow-inner">
          <div>
            Velocity: <span className="text-white font-bold">{velocity} m/s</span>
          </div>
          <div>
            Max Height: <span className="text-white font-bold">{maxHeight} m</span>
          </div>
          <div>
            Max Range:{' '}
            <span
              className={`font-bold ${
                angle === 45 ? 'text-[#d4ff3a] text-sm' : 'text-white'
              }`}
            >
              {range} m {angle === 45 && '★ (Max Range)'}
            </span>
          </div>
        </div>
      </div>
    </SocraticSplitLayout>
  )
}
