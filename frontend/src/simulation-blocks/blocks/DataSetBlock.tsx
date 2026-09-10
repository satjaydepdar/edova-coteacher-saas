import React, { useState } from 'react'
import SocraticSplitLayout from '../components/SocraticSplitLayout'
import { BlockProps } from '../types'

export default function DataSetBlock({ json, onEvent }: BlockProps) {
  const [data, setData] = useState<number[]>(json?.stats?.data || [4, 8, 6, 5, 12])
  const sum = data.reduce((a: number, b: number) => a + b, 0)
  const mean = (sum / (data.length || 1)).toFixed(2)

  const addPoint = (val: number) => {
    setData((prev) => [...prev, val])
  }

  const liveObservation = `Currently dataset has <b>${data.length} items</b> [${data.join(', ')}] with Sum = <b>${sum}</b>. Calculated <b>Mean = ${mean}</b>.`

  return (
    <SocraticSplitLayout
      json={json}
      blockId={json?.id || 'dataset-block-1'}
      blockType="dataset"
      blockState={{ data, sum, mean }}
      liveObservation={liveObservation}
      initialHint="Explore central tendency! Click buttons on the right to add data points and watch how the <b>Mean</b> value responds in real-time."
      topicTitle="Welcome to Statistics & Data Analysis"
      topicSubtitle="Measures of Central Tendency"
      prompt={json?.content?.prompt || 'Determine the mean, median, and spread of the dataset.'}
      progressPercent={50}
      points={80}
      quickQuestions={[
        'How is mean calculated?',
        'What is median vs mean?',
        'How does adding an outlier affect mean?'
      ]}
      onEvent={onEvent}
    >
      <div className="w-full flex flex-col items-center justify-center space-y-6">
        <div className="flex flex-wrap justify-center gap-2">
          {data.map((val: number, i: number) => (
            <div
              key={i}
              className="tile px-4 py-3 bg-[#1e2a22] border border-[#2a3f32] text-white rounded-xl font-mono text-base font-bold shadow-md"
            >
              {val}
            </div>
          ))}
        </div>

        <div className="bg-[#1a1a1a] border border-zinc-700 rounded-xl px-6 py-4 flex items-center gap-4 text-sm font-mono shadow-inner">
          <span className="text-zinc-400">Sum = {sum}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">Count = {data.length}</span>
          <span className="text-zinc-600">|</span>
          <span>
            Mean = <span className="text-[#d4ff3a] font-bold text-lg">{mean}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
          <span>Add data point:</span>
          {[2, 7, 10, 15].map((num) => (
            <button
              key={num}
              onClick={() => addPoint(num)}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md border border-zinc-700 cursor-pointer"
            >
              +{num}
            </button>
          ))}
          <button
            onClick={() => setData([4, 8, 6, 5, 12])}
            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md border border-zinc-700 ml-2 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    </SocraticSplitLayout>
  )
}
