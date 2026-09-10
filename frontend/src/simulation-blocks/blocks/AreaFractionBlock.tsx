import React, { useState } from 'react'
import SocraticSplitLayout from '../components/SocraticSplitLayout'
import { BlockProps } from '../types'

export default function AreaFractionBlock({ json, onEvent }: BlockProps) {
  const [numerator, setNumerator] = useState(2)
  const [denominator, setDenominator] = useState(2)

  const isWhole = numerator === denominator
  const fractionVal = (numerator / (denominator || 1)).toFixed(3)

  const liveObservation = isWhole
    ? `You set <b>${numerator}/${denominator} (${fractionVal})</b> — the numerator equals the denominator, representing <b>1 whole (100% area)</b>!`
    : `You shaded <b>${numerator}</b> out of <b>${denominator}</b> equal parts. Current fraction is <b>${numerator}/${denominator} (${fractionVal})</b>.`

  return (
    <SocraticSplitLayout
      json={json}
      blockId={json?.id || 'area-fraction-1'}
      blockType="area-fraction"
      blockState={{ numerator, denominator }}
      liveObservation={liveObservation}
      initialHint="Welcome to Fractions & Proportions! Adjust the <b>Numerator</b> and <b>Denominator</b> sliders to observe how shaded parts relate to the total whole."
      topicTitle="Welcome to Fractions & Proportions"
      topicSubtitle="Area Models of Fractions"
      prompt={
        json?.content?.prompt ||
        'Fractional area coverage models. Adjust numerator and denominator to represent proportions.'
      }
      progressPercent={45}
      points={65}
      quickQuestions={[
        'What does denominator represent in area models?',
        'How to simplify fractions?',
        'What happens when numerator equals denominator?'
      ]}
      onEvent={onEvent}
    >
      <div className="w-full flex flex-col items-center justify-center space-y-6">
        <div className="flex gap-2">
          {Array.from({ length: denominator }).map((_, i) => (
            <div
              key={i}
              className={`w-12 h-16 rounded-lg border flex items-center justify-center font-mono font-bold transition-all ${
                i < numerator
                  ? 'bg-[#2a3a2a] border-[#d4ff3a] text-[#d4ff3a] tile-active'
                  : 'bg-[#1e1e1e] border-zinc-700 text-zinc-600'
              }`}
            >
              {i < numerator ? '1' : '0'}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span>Numerator:</span>
            <input
              type="range"
              min={1}
              max={denominator}
              value={numerator}
              onChange={(e) => setNumerator(parseInt(e.target.value, 10))}
              className="w-28"
            />
            <span className="text-[#d4ff3a] font-bold text-sm">{numerator}</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Denominator:</span>
            <input
              type="range"
              min={2}
              max={12}
              value={denominator}
              onChange={(e) => {
                const newDen = parseInt(e.target.value, 10)
                setDenominator(newDen)
                if (numerator > newDen) setNumerator(newDen)
              }}
              className="w-28"
            />
            <span className="text-white font-bold text-sm">{denominator}</span>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-zinc-700 rounded-xl px-6 py-3 font-mono text-sm">
          Fraction = <span className="text-[#d4ff3a] font-bold text-base">{numerator}/{denominator}</span> ({(numerator / denominator).toFixed(3)})
        </div>
      </div>
    </SocraticSplitLayout>
  )
}
