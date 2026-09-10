import { useState, useMemo } from 'react'
import SocraticSplitLayout from '../components/SocraticSplitLayout'
import { logEvent } from '../instrument/logger'
import { BlockProps } from '../types'
import { Sparkles, ArrowRight, CheckCircle2, RotateCcw, ArrowLeft } from 'lucide-react'

function generateRandomizedPresets(problemType: 'park' | 'rocket' | 'consecutive'): number[] {
  if (problemType === 'rocket') {
    const correct = 5
    const pool = [1, 2, 3, 4, 6, 7, 8].filter((n) => n !== correct)
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5)
    const distractors = shuffledPool.slice(0, 3)
    return [correct, ...distractors].sort((a, b) => a - b)
  }
  if (problemType === 'consecutive') {
    const correct = 13
    const pool = [8, 9, 10, 11, 12, 14, 15, 16, 17].filter((n) => n !== correct)
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5)
    const distractors = shuffledPool.slice(0, 3)
    return [correct, ...distractors].sort((a, b) => a - b)
  }
  // Default: Park Area Problem (target 528 m², correct breadth = 16)
  return [10, 16, 20, 24]
}

export default function AlgebraTileBlock({ json, onEvent }: BlockProps) {
  const targetArea = json?.algebra?.target ?? 528
  const sliderMin = json?.algebra?.slider?.min ?? 0
  const sliderMax = json?.algebra?.slider?.max ?? 25
  const blockId = json?.id || 'quad-park-528'

  const isRocket = blockId.includes('rocket')
  const isConsecutive = blockId.includes('consec')
  const problemType = isRocket ? 'rocket' : isConsecutive ? 'consecutive' : 'park'

  // Start with default unselected / interactive state
  const [x, setX] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState<'problem' | 'factorization'>('problem')
  const [revealedStep, setRevealedStep] = useState<number>(1)
  const [presetValues, setPresetValues] = useState<number[]>(() => generateRandomizedPresets(problemType))

  const hasSelected = x !== null
  const currentX = x ?? 0

  // Problem-specific calculations
  const L = isRocket
    ? (hasSelected ? -5 * currentX * currentX + 20 * currentX + 25 : '?')
    : isConsecutive
    ? (hasSelected ? currentX + 1 : '?')
    : (hasSelected ? 2 * currentX + 1 : '?')

  const A = isRocket
    ? (hasSelected ? -5 * currentX * currentX + 20 * currentX + 25 : '?')
    : isConsecutive
    ? (hasSelected ? currentX * currentX + (currentX + 1) * (currentX + 1) : '?')
    : (hasSelected ? currentX * (2 * currentX + 1) : '?')

  const isCorrect = hasSelected && (
    isRocket
      ? currentX === 5 || A === 0 || currentX === 2
      : isConsecutive
      ? currentX === 13 && A === 365
      : typeof A === 'number' && A === targetArea
  )

  const handleSliderChange = (newX: number) => {
    setX(newX)
    const evt = { blockId, type: 'slider', value: newX, timestamp: Date.now() }
    logEvent(evt)
    onEvent?.(evt)
  }

  const navigateToFactorization = () => {
    setCurrentPage('factorization')
    setRevealedStep(1)
    const evt = { blockId, type: 'navigate-page', value: 'factorization', timestamp: Date.now() }
    logEvent(evt)
    onEvent?.(evt)
  }

  const navigateToProblem = () => {
    setCurrentPage('problem')
    const evt = { blockId, type: 'navigate-page', value: 'problem', timestamp: Date.now() }
    logEvent(evt)
    onEvent?.(evt)
  }

  const solveAnotherProblem = () => {
    setX(null)
    setRevealedStep(1)
    setPresetValues(generateRandomizedPresets(problemType))
    setCurrentPage('problem')
    const evt = { blockId, type: 'new-problem', value: null, timestamp: Date.now() }
    logEvent(evt)
    onEvent?.(evt)
  }

  const progressPercent = !hasSelected
    ? 20
    : currentPage === 'factorization'
    ? Math.min(100, 50 + revealedStep * 12.5)
    : Math.min(100, 40 + (isCorrect ? 60 : 25))

  const liveObservation = useMemo(() => {
    if (currentPage === 'factorization') {
      if (isRocket) {
        if (revealedStep === 1) {
          return `📖 <b>Step 1: Rocket Ground Landing Condition</b><br><br>When the rocket hits the ground, its height is zero: <span class='font-mono font-bold text-forest'>h(t) = 0</span>.<br><br><span class='font-mono bg-cream px-2.5 py-1 rounded-lg text-forest inline-block border border-black/10'>-5t² + 20t + 25 = 0 → -5(t² - 4t - 5) = 0</span><br><br>Ask me how we factor out -5 or why height equals zero!`
        }
        return `🎯 <b>Step 2: Factoring & Landing Roots</b><br><br>Factoring gives <span class='font-mono font-bold text-forest'>(t - 5)(t + 1) = 0</span>, yielding roots <b>t = 5 s</b> and <b>t = -1 s</b>.<br><br>💡 Since flight time cannot be negative, we discard -1 s to find <b>Landing Time = 5 seconds</b>!`
      }
      if (isConsecutive) {
        if (revealedStep === 1) {
          return `📖 <b>Step 1: Algebraic Formulation of Consecutive Squares</b><br><br>If the first positive integer is <b>x</b>, the next consecutive integer is <b>x + 1</b>.<br><br><span class='font-mono bg-cream px-2.5 py-1 rounded-lg text-forest inline-block border border-black/10'>x² + (x + 1)² = 365 → 2x² + 2x − 364 = 0</span><br><br>Ask me any question about setting up consecutive numbers!`
        }
        return `🎯 <b>Step 2: Factoring & Discarding Negative Integers</b><br><br>Dividing by 2 gives <span class='font-mono'>x² + x − 182 = 0</span>, which factors into <span class='font-mono font-bold text-forest'>(x + 14)(x − 13) = 0</span>.<br><br>💡 Since the problem specifies <i>positive integers</i>, we discard x = -14 and keep <b>x = 13</b> (next integer is <b>14</b>)!`
      }

      // Default: Park Problem
      if (revealedStep === 1) {
        return `📖 <b>Step 1: Setting up Standard Quadratic Form</b><br><br>Why do we multiply breadth (x) by length (2x + 1)? Equating total area x(2x + 1) = 528 m² produces standard form <b>2x² + x − 528 = 0</b> where a = 2, b = 1, and c = -528.<br><br>💡 Ask Hermes why setting standard form equal to zero is essential before factoring!`
      }
      if (revealedStep === 2) {
        return `🔍 <b>Step 2: Splitting the Middle Term (AC Method)</b><br><br>Why do we multiply a × c = 2 × (-528) = <b>-1056</b>? The AC method finds two integers whose product is a·c and sum is b.<br><br>💡 The pair is <b>+33</b> and <b>-32</b> because 33 × (-32) = -1056 and 33 − 32 = +1. Ask Hermes how to spot these factors quickly!`
      }
      if (revealedStep === 3) {
        return `🧩 <b>Step 3: Factoring by Grouping</b><br><br>Notice how pairing 2x² + 33x and -32x - 528 reveals the common binomial anchor <b>(2x + 33)</b> across both halves:<br><br>• x(2x + 33) − 16(2x + 33) = 0<br><br>💡 Ask Hermes why factoring out -16 flips the sign of -528 into +33!`
      }
      return `🎯 <b>Step 4: Roots & Real-World Physical Validation</b><br><br>Setting each linear factor to zero yields roots x = 16 and x = -16.5. Why must we reject -16.5?<br><br>💡 In physical geometry, a real park boundary cannot have negative length! Thus, <b>Breadth = 16 m</b> and <b>Length = 33 m</b>.`
    }

    if (!hasSelected) {
      if (isRocket) return 'Select flight time <b>t</b> (in seconds) on the right to track rocket height.'
      if (isConsecutive) return 'Select an integer <b>x</b> on the right to evaluate sum of squares x² + (x+1)².'
      return 'Select a breadth value <b>x</b> (in meters) to begin exploring the dimensions and area.'
    }
    if (isRocket) {
      return currentX === 5
        ? `Spot on! At flight time <b>t = 5 seconds</b>, rocket height reaches <b>h(5) = 0 m</b> (ground landing impact) ✓`
        : currentX === 2
        ? `Vertex peak reached! At flight time <b>t = 2 seconds</b>, rocket reaches maximum apex height <b>h = 45 meters</b> ✓`
        : `At flight time <b>t = ${currentX} seconds</b>, rocket height is <b>h(${currentX}) = ${A} meters</b>.<br><br>💡 To find when it hits the ground, test <b>t = 5 s</b> where height equals 0 m!`
    }
    if (isConsecutive) {
      return isCorrect
        ? `Spot on! Integers <b>x = 13</b> and <b>x+1 = 14</b> give 13² + 14² = 169 + 196 = <b>365 ✓</b>`
        : `With first integer <b>x = ${currentX}</b> (and second integer <b>${currentX + 1}</b>), sum of squares is <b>${A}</b>.<br><br>💡 Target sum is <b>365</b> (try adjusting x)!`
    }
    return isCorrect
      ? `Spot on! At breadth <b>x = ${currentX} m</b>, length is <b>2(${currentX}) + 1 = ${L} m</b>, giving exact <b>Area = ${A} m² ✓</b>`
      : typeof A === 'number' && A < targetArea
      ? `Breadth <b>x = ${currentX} m</b> (Length = ${L} m) gives <b>Area = ${A} m²</b>, which is <i>smaller</i> than target ${targetArea} m². Try increasing breadth!`
      : `Breadth <b>x = ${currentX} m</b> (Length = ${L} m) gives <b>Area = ${A} m²</b>, which is <i>larger</i> than target ${targetArea} m². Try decreasing breadth!`
  }, [currentPage, revealedStep, hasSelected, isRocket, isConsecutive, currentX, L, A, isCorrect, targetArea])

  // Context-aware Socratic Quick Questions synchronized with current problem & step
  const quickQuestions = useMemo(() => {
    if (currentPage === 'problem') {
      if (isRocket) {
        return [
          'Why is t = 5 s the landing time?',
          'What does each letter stand for?',
          'How to find max height vertex?'
        ]
      }
      if (isConsecutive) {
        return [
          'Why are numbers x and x+1?',
          'Why is x = -14 discarded?',
          'Why is this the answer?'
        ]
      }
      return [
        'Why is this the answer?',
        'How to form the equation?',
        'Why discard negative root?'
      ]
    }
    if (revealedStep === 1) {
      return [
        'Why is length 2x + 1?',
        'How to form standard form ax²+bx+c=0?'
      ]
    }
    if (revealedStep === 2) {
      return [
        'What is the AC Method?',
        'How to find factors of -1056?'
      ]
    }
    if (revealedStep === 3) {
      return [
        'How to factor by grouping?',
        'Why is (2x+33) common in both?'
      ]
    }
    return [
      'Why discard negative root?',
      'Why is breadth 16 m?'
    ]
  }, [currentPage, revealedStep, isRocket, isConsecutive])

  return (
    <SocraticSplitLayout
      json={json}
      blockId={blockId}
      blockType="algebra-tile"
      chapterId="chapter-04-quadratic-equations"
      conceptId="QUAD-02"
      blockState={{ x: currentX, L, A, targetArea, isCorrect, hasSelected, revealedStep }}
      liveObservation={liveObservation}
      initialHint={
        isRocket
          ? `Welcome to Projectile Trajectories! Select flight time <b>t</b> from (${presetValues.join(', ')}) on the right to discover when the rocket reaches peak height and lands.`
          : isConsecutive
          ? `Explore consecutive integers! Select integer <b>x</b> from (${presetValues.join(', ')}) on the right such that x² + (x+1)² = 365.`
          : `Welcome! Drag the breadth slider or select a preset <span class="inline-block bg-cream border border-black/10 rounded-md px-2 py-0.5 font-mono font-bold text-forest text-xs">(10, 16, 20, 24)</span> on the right to test your first breadth <span class="font-mono font-bold text-forest">(x)</span>.`
      }
      topicTitle={
        currentPage === 'factorization'
          ? 'Algebraic Factorization & Roots'
          : isRocket
          ? 'Rocket Trajectory & Kinematics'
          : isConsecutive
          ? 'Consecutive Numbers & Algebra'
          : 'Quadratic Equations & Geometry'
      }
      topicSubtitle={
        currentPage === 'factorization'
          ? 'Algebraic Factorization & Roots'
          : isRocket
          ? 'Time, Velocity, and Vertex Apex'
          : isConsecutive
          ? 'Integers and Sum of Squares'
          : 'Variables, Expressions, and Area'
      }
      prompt={
        currentPage === 'problem'
          ? isRocket
            ? 'A model rocket is launched vertically. Flight time is t (seconds) and height is h(t) = -5t² + 20t + 25 (meters). Find the landing time (when h(t) = 0 m) and max apex height.'
            : isConsecutive
            ? 'Find two consecutive positive integers x (1st integer) and x + 1 (2nd integer) such that the sum of their squares is 365: x² + (x+1)² = 365.'
            : (json?.content?.prompt ||
              'Solve for rectangular park dimensions where length is one more than twice breadth using tile models.')
          : `Factorization Derivation: Step ${revealedStep} of 4`
      }
      progressPercent={progressPercent}
      points={75}
      quickQuestions={quickQuestions}
      onEvent={onEvent}
      onAgentResponse={(res) => {
        if (res.ui === 'show-factorization') {
          setCurrentPage('factorization')
          setRevealedStep(1)
        }
      }}
      rightPanelHeaderExtra={
        currentPage === 'factorization' ? (
          <div className="pt-2">
            <button
              onClick={navigateToProblem}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-black/5 text-forest border border-black/10 text-[12px] font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Problem
            </button>
          </div>
        ) : null
      }
    >
      {currentPage === 'problem' ? (
        /* SCREENSHOT 3: INTERACTIVE ALGEBRA TILES WORKSPACE (SAAS DESIGN SYSTEM) */
        <div className="w-full flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto py-2">
          
          {/* Scaled-Up Algebra Tiles Visual Representation */}
          <div className="flex items-center justify-center gap-6 py-4">
            {/* 2 Breadth (x) Tiles */}
            <div className="flex gap-4">
              <div
                className={`w-[130px] h-[170px] md:w-[150px] md:h-[200px] rounded-[18px] flex flex-col items-center justify-center font-mono transition-all shadow-card ${
                  hasSelected ? 'bg-white border-2 border-gold ring-2 ring-gold/20' : 'bg-white/60 border border-dashed border-black/20'
                }`}
              >
                <span className="text-[12px] text-forest/60 font-ui uppercase font-bold tracking-wider">
                  BREADTH
                </span>
                <span className={`font-black text-4xl md:text-5xl font-mono mt-2 ${hasSelected ? 'text-forest' : 'text-forest/30 animate-pulse'}`}>
                  {hasSelected ? currentX : '?'}
                </span>
                <span className="text-[12px] text-forest/50 font-mono mt-1 font-bold">
                  (x)
                </span>
              </div>

              <div
                className={`w-[130px] h-[170px] md:w-[150px] md:h-[200px] rounded-[18px] flex flex-col items-center justify-center font-mono transition-all shadow-card ${
                  hasSelected ? 'bg-white border-2 border-gold ring-2 ring-gold/20' : 'bg-white/60 border border-dashed border-black/20'
                }`}
              >
                <span className="text-[12px] text-forest/60 font-ui uppercase font-bold tracking-wider">
                  BREADTH
                </span>
                <span className={`font-black text-4xl md:text-5xl font-mono mt-2 ${hasSelected ? currentX : '?'} `}>
                  {hasSelected ? currentX : '?'}
                </span>
                <span className="text-[12px] text-forest/50 font-mono mt-1 font-bold">
                  (x)
                </span>
              </div>
            </div>

            {/* Vertical Unit Tiles Column (+1) */}
            <div className="flex flex-col gap-2">
              <div className="w-12 h-10 rounded-xl bg-white border border-black/10 flex items-center justify-center font-mono font-bold text-[13px] text-forest shadow-xs">
                +1
              </div>
              <div className="w-12 h-10 rounded-xl bg-white/40 border border-dashed border-black/10" />
              <div className="w-12 h-10 rounded-xl bg-white/40 border border-dashed border-black/10" />
            </div>

            {/* Dimension Calculation Badge */}
            <div className="ml-2 md:ml-4 text-[13px] md:text-[15px] text-forest font-mono bg-white border border-black/10 px-5 py-4 rounded-[16px] shadow-card">
              Length = 2x + 1 = <span className="font-bold text-forest">{hasSelected ? `${L} m` : '?'}</span>
            </div>
          </div>

          {/* Evaluated Equation Display */}
          <div className="flex flex-wrap items-center justify-center gap-3 bg-white border border-black/[0.08] rounded-[20px] px-6 py-4 shadow-card text-[14px] md:text-[16px] font-mono">
            <span className="text-forest/60 font-semibold">Area = x · (2x + 1) =</span>
            <span
              className={`px-4 py-1.5 rounded-xl font-mono font-black text-[16px] md:text-[18px] transition-all ${
                isCorrect
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs'
                  : hasSelected
                  ? 'bg-cream text-forest border border-black/10'
                  : 'bg-cream/40 border border-dashed border-black/20 text-forest/40'
              }`}
            >
              {hasSelected ? `${A} m²` : '?'}
            </span>
            {isCorrect && (
              <span className="text-emerald-700 text-[13px] font-bold flex items-center gap-1">
                ✓ (Target 528 m²)
              </span>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2.5 bg-white border border-black/[0.06] rounded-2xl px-5 py-3 shadow-xs">
            <span className="text-[12px] text-forest/60 font-bold mr-1">Presets:</span>
            {presetValues.map((v) => (
              <button
                key={v}
                onClick={() => handleSliderChange(v)}
                className={`px-4 py-1.5 rounded-xl text-[13px] font-mono font-bold transition-all cursor-pointer ${
                  x === v
                    ? 'bg-forest text-white shadow-xs'
                    : 'bg-cream hover:bg-cream-border text-forest/80 border border-black/[0.06]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Range Slider */}
          <div className="w-full flex items-center justify-center gap-4 text-[13px] font-mono text-forest bg-white border border-black/[0.06] rounded-2xl p-4 shadow-xs">
            <span className="font-bold">Breadth (x):</span>
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              value={x ?? sliderMin}
              onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
              className="flex-1 max-w-[320px]"
            />
            <span className="font-bold text-[14px] px-2.5 py-0.5 rounded-md bg-cream border border-black/10">
              {hasSelected ? `${currentX} m` : 'Unset'}
            </span>
          </div>

          {/* SINGLE PROMINENT PRIMARY ACTION BUTTON */}
          <div className="w-full pt-4">
            <button
              onClick={navigateToFactorization}
              disabled={!hasSelected}
              className={`w-full py-4 rounded-[18px] font-display font-bold text-[14px] md:text-[15px] tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
                !hasSelected
                  ? 'bg-cream text-forest/40 border border-black/[0.08] cursor-not-allowed'
                  : 'bg-forest hover:bg-forest-raised text-white cursor-pointer shadow-card-hover'
              }`}
            >
              <span>Check & View Factorization Solution</span>
              <CheckCircle2 className="w-4 h-4 text-gold" />
            </button>
          </div>
        </div>
      ) : (
        /* SCREENSHOT 4: STEP-WISE FACTORIZATION VIEW (SAAS DESIGN SYSTEM) */
        <div className="w-full max-w-3xl bg-white border border-black/[0.08] rounded-[24px] p-6 md:p-8 space-y-6 shadow-card font-ui leading-relaxed">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-forest/70 bg-cream px-2.5 py-0.5 rounded-full border border-black/[0.06]">
                  Step-by-Step Factorization (AC Method)
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                  Step {revealedStep} of 4
                </span>
              </div>
              <h2 className="font-display text-[18px] md:text-[20px] font-bold text-forest mt-1.5">
                Factorization of 2x² + x − 528 = 0
              </h2>
            </div>
            <button
              onClick={navigateToProblem}
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-xl bg-cream hover:bg-cream-border border border-black/10 text-forest transition-colors cursor-pointer"
            >
              Back to Problem
            </button>
          </div>

          {/* Derivation Steps Grid */}
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="space-y-2 p-5 rounded-[18px] bg-cream border border-black/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[14px] font-bold text-forest">
                  <span className="w-6 h-6 rounded-full bg-forest text-white flex items-center justify-center text-[11px] font-bold">1</span>
                  <span>Formulating Standard Quadratic Form</span>
                </div>
                <span className="text-[11px] font-mono text-forest/70 bg-white border border-black/10 px-2 py-0.5 rounded-md">ax² + bx + c = 0</span>
              </div>
              <p className="text-[13px] text-forest/70 pl-8.5">Given Area = 528 m², Breadth = x, and Length = 2x + 1:</p>
              <div className="ml-8.5 bg-white border border-black/[0.08] rounded-xl p-3.5 font-mono text-[13px] flex items-center justify-between shadow-xs">
                <span className="text-forest/70">x · (2x + 1) = 528</span>
                <span className="text-forest font-bold">2x² + x − 528 = 0</span>
              </div>
            </div>

            {/* Step 2 */}
            {revealedStep >= 2 && (
              <div className="space-y-2 p-5 rounded-[18px] bg-cream border border-black/[0.06] animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-[14px] font-bold text-forest">
                    <span className="w-6 h-6 rounded-full bg-forest text-white flex items-center justify-center text-[11px] font-bold">2</span>
                    <span>Splitting the Middle Term (AC Method)</span>
                  </div>
                  <span className="text-[11px] font-mono text-forest/70 bg-white border border-black/10 px-2 py-0.5 rounded-md">a · c = -1056</span>
                </div>
                <p className="text-[13px] text-forest/70 pl-8.5">
                  Multiply a × c = 2 × (-528) = <b>-1056</b>. Find two numbers whose product is -1056 and sum is +1:
                </p>
                <div className="ml-8.5 bg-white border border-black/[0.08] rounded-xl p-3.5 font-mono text-[13px] text-forest flex flex-wrap items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-forest/60">Factors:</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">+33</span>
                    <span className="px-2.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold">-32</span>
                  </div>
                  <div className="text-[12px] text-forest/60">
                    (33) × (-32) = -1056 &nbsp;|&nbsp; 33 − 32 = +1
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {revealedStep >= 3 && (
              <div className="space-y-2 p-5 rounded-[18px] bg-cream border border-black/[0.06] animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-[14px] font-bold text-forest">
                    <span className="w-6 h-6 rounded-full bg-forest text-white flex items-center justify-center text-[11px] font-bold">3</span>
                    <span>Factor by Grouping</span>
                  </div>
                  <span className="text-[11px] font-mono text-forest/70 bg-white border border-black/10 px-2 py-0.5 rounded-md">Common Binomial</span>
                </div>
                <div className="ml-8.5 bg-white border border-black/[0.08] rounded-xl p-3.5 font-mono text-[13px] text-forest space-y-1.5 shadow-xs">
                  <div className="text-forest/60">2x² + 33x − 32x − 528 = 0</div>
                  <div className="text-forest/80">x(2x + 33) − 16(2x + 33) = 0</div>
                  <div className="pt-1.5 border-t border-black/[0.06] text-forest font-bold">
                    (2x + 33)(x − 16) = 0
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 */}
            {revealedStep >= 4 && (
              <div className="space-y-2 p-5 rounded-[18px] bg-cream border border-black/[0.06] animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-[14px] font-bold text-forest">
                    <span className="w-6 h-6 rounded-full bg-forest text-white flex items-center justify-center text-[11px] font-bold">4</span>
                    <span>Roots & Physical Geometric Validation</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">Validated</span>
                </div>
                <div className="ml-8.5 space-y-2.5">
                  <div className="bg-white border border-black/[0.08] rounded-xl p-3.5 font-mono text-[13px] text-forest shadow-xs">
                    2x + 33 = 0 → x = -33/2 = -16.5 &nbsp;|&nbsp; x − 16 = 0 → x = 16
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[12px] font-mono flex items-center gap-2">
                    <span className="font-bold">✕ Discard x = -16.5</span>
                    <span className="text-rose-700/80 font-ui">(Breadth cannot be negative in physical geometry)</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold font-mono text-[13px] flex flex-wrap items-center justify-between gap-2 shadow-xs">
                    <span>✓ Valid Solution: Breadth (x) = 16 m</span>
                    <span>Length (2x + 1) = 33 m</span>
                    <span className="text-forest font-black">Area = 528 m²</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Navigation Controls */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {revealedStep < 4 ? (
              <>
                <button
                  onClick={() => setRevealedStep((s) => s + 1)}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-forest hover:bg-forest-raised text-white font-bold text-[13px] shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <span>
                    {revealedStep === 1
                      ? 'Next: Step 2 (Splitting Middle Term & AC Method) →'
                      : revealedStep === 2
                      ? 'Next: Step 3 (Factor by Grouping) →'
                      : 'Next: Step 4 (Roots & Real-World Validation) →'}
                  </span>
                </button>
                <button
                  onClick={() => setRevealedStep(4)}
                  className="py-3.5 px-5 rounded-xl bg-cream hover:bg-cream-border border border-black/10 text-forest font-semibold text-[13px] cursor-pointer transition-all"
                >
                  Show All Steps
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={solveAnotherProblem}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-forest hover:bg-forest-raised text-white font-bold text-[13px] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Solve Another Problem</span>
                </button>
                <button
                  onClick={navigateToProblem}
                  className="py-3.5 px-6 rounded-xl bg-cream hover:bg-cream-border border border-black/10 text-forest font-semibold text-[13px] cursor-pointer transition-all"
                >
                  Back to Tile Workspace
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </SocraticSplitLayout>
  )
}
