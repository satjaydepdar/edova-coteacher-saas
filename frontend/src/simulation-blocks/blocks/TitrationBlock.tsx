import React, { useState } from 'react'
import SocraticSplitLayout from '../components/SocraticSplitLayout'
import { BlockProps } from '../types'

export default function TitrationBlock({ json, onEvent }: BlockProps) {
  const [titrantVol, setTitrantVol] = useState(25) // mL NaOH added
  const initialAcidVol = 50 // 50 mL 0.1M HCl
  const equivalenceVol = 50 // equivalence at 50 mL

  // Calculate approximate pH
  let pH = 7
  if (titrantVol < equivalenceVol) {
    const unreactedMoles = 0.1 * ((initialAcidVol - titrantVol) / 1000)
    const totalVol = (initialAcidVol + titrantVol) / 1000
    const hConc = unreactedMoles / totalVol
    pH = Number((-Math.log10(hConc)).toFixed(2))
  } else if (titrantVol > equivalenceVol) {
    const excessBaseMoles = 0.1 * ((titrantVol - equivalenceVol) / 1000)
    const totalVol = (initialAcidVol + titrantVol) / 1000
    const ohConc = excessBaseMoles / totalVol
    pH = Number((14 + Math.log10(ohConc)).toFixed(2))
  }

  const isEquivalence = titrantVol === equivalenceVol
  const liveObservation = isEquivalence
    ? `Equivalence point reached! At exactly <b>50 mL NaOH</b>, moles of H⁺ = moles of OH⁻, achieving neutral <b>pH = 7.00 ✓</b>`
    : titrantVol < equivalenceVol
    ? `Current NaOH added is <b>${titrantVol} mL</b> (pH = <b>${pH}</b>, acidic solution). Keep adding titrant towards 50 mL!`
    : `Current NaOH added is <b>${titrantVol} mL</b> (pH = <b>${pH}</b>, basic solution with excess OH⁻ ions).`

  return (
    <SocraticSplitLayout
      json={json}
      blockId={json?.id || 'titration-block-1'}
      blockType="titration"
      blockState={{ titrantVol, pH, isEquivalence }}
      liveObservation={liveObservation}
      initialHint="Welcome to Acid-Base Titrations! Add <b>NaOH Titrant volume</b> to observe the neutralization and pH equivalence point."
      topicTitle="Welcome to Chemistry & Solution Equilibria"
      topicSubtitle="Strong Acid - Strong Base Titrations"
      prompt={
        json?.content?.prompt ||
        '50 mL 0.1M HCl titrated with 0.1M NaOH. Find the equivalence point and examine pH changes.'
      }
      progressPercent={65}
      points={90}
      quickQuestions={[
        'What is the equivalence point pH for strong acid-strong base?',
        'Why does pH change sharply near equivalence?',
        'How do we calculate moles of NaOH required?'
      ]}
      onEvent={onEvent}
    >
      <div className="w-full flex flex-col items-center justify-center space-y-6">
        <div className="flex justify-center items-center gap-4 py-2">
          <label className="text-xs text-zinc-400 font-mono">NaOH Volume added:</label>
          <input
            type="range"
            min={0}
            max={100}
            value={titrantVol}
            onChange={(e) => setTitrantVol(parseInt(e.target.value, 10))}
            className="w-56"
          />
          <span className="font-mono text-[#d4ff3a] font-bold text-lg">{titrantVol} mL</span>
        </div>

        <div className="w-full flex justify-around bg-[#1a1a1a] border border-zinc-700 rounded-xl p-4 text-xs font-mono shadow-inner">
          <div>
            Analyte: <span className="text-white font-bold">50 mL 0.1M HCl</span>
          </div>
          <div>
            Titrant: <span className="text-white font-bold">0.1M NaOH</span>
          </div>
          <div>
            Current pH:{' '}
            <span className={`font-bold ${isEquivalence ? 'text-[#d4ff3a] text-sm' : 'text-white'}`}>
              {pH} {isEquivalence && '✓ (Neutral Equivalence)'}
            </span>
          </div>
        </div>
      </div>
    </SocraticSplitLayout>
  )
}
