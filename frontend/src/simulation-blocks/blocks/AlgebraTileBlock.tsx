import { useState, useMemo, useRef, useEffect } from 'react'
import SocraticSplitLayout from '../components/SocraticSplitLayout'
import { logEvent } from '../instrument/logger'
import { BlockProps } from '../types'
import { RotateCcw, ArrowLeft } from 'lucide-react'

function getProblemPresets(problemType: 'park' | 'rocket' | 'consecutive'): number[] {
  if (problemType === 'rocket') {
    return [1, 2, 5, 8]
  }
  if (problemType === 'consecutive') {
    return [10, 13, 15, 16]
  }
  // Default: Park Area Problem (target 528 m², correct breadth = 16)
  return [10, 16, 20, 24]
}

export default function AlgebraTileBlock({ json, onEvent }: BlockProps) {
  const targetArea = json?.algebra?.target ?? 365
  const blockId = json?.id || 'quad-consec-sim'

  const isRocket = blockId.includes('rocket')
  const isPark = blockId.includes('park')
  const isConsecutive = !isRocket && !isPark
  const problemType = isRocket ? 'rocket' : isConsecutive ? 'consecutive' : 'park'

  const sliderMinVal = isRocket ? 0 : isConsecutive ? 5 : 10
  const sliderMaxVal = isRocket ? 10 : isConsecutive ? 20 : 25
  const defaultVal = isRocket ? 5 : isConsecutive ? 13 : 16

  // Start with default unselected / interactive state
  const [x, setX] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState<'problem' | 'factorization'>('problem')
  const [revealedStep, setRevealedStep] = useState<number>(1)
  const [presetValues, setPresetValues] = useState<number[]>(() => getProblemPresets(problemType))

  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

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
      ? currentX === 5 || A === 0
      : isConsecutive
      ? currentX === 13 && A === 365
      : typeof A === 'number' && A === 528
  )

  const handleSliderChange = (newX: number) => {
    setX(newX)
    const evt = { blockId, type: 'slider', value: newX, timestamp: Date.now() }
    logEvent(evt)
    onEvent?.(evt)
  }

  const updateSliderFromClientX = (clientX: number) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const rawVal = sliderMinVal + ratio * (sliderMaxVal - sliderMinVal)
    const rounded = Math.round(rawVal)
    handleSliderChange(rounded)
  }

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      updateSliderFromClientX(clientX)
    }
    const onUp = () => setIsDragging(false)

    if (isDragging) {
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      window.addEventListener('touchmove', onMove)
      window.addEventListener('touchend', onUp)
    }
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [isDragging, sliderMinVal, sliderMaxVal])

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
    setPresetValues(getProblemPresets(problemType))
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
          return `📖 <b>Step 1: Rocket Ground Landing Condition</b><br><br>When the rocket hits the ground, its height is zero: <span class='font-mono font-bold text-[#4A7C59]'>h(t) = 0</span>.<br><br><span class='font-mono bg-[#F6F1E6] px-2.5 py-1 rounded-lg text-[#4A7C59] inline-block border border-black/10'>-5t² + 20t + 25 = 0 → -5(t² - 4t - 5) = 0</span><br><br>Ask me how we factor out -5 or why height equals zero!`
        }
        return `🎯 <b>Step 2: Factoring & Landing Roots</b><br><br>Factoring gives <span class='font-mono font-bold text-[#4A7C59]'>(t - 5)(t + 1) = 0</span>, yielding roots <b>t = 5 s</b> and <b>t = -1 s</b>.<br><br>💡 Since flight time cannot be negative, we discard -1 s to find <b>Landing Time = 5 seconds</b>!`
      }
      if (isConsecutive) {
        if (revealedStep === 1) {
          return `📖 <b>Step 1: Algebraic Formulation of Consecutive Squares</b><br><br>If the first positive integer is <b>x</b>, the next consecutive integer is <b>x + 1</b>.<br><br><span class='font-mono bg-[#F6F1E6] px-2.5 py-1 rounded-lg text-[#4A7C59] inline-block border border-black/10'>x² + (x + 1)² = 365 → 2x² + 2x − 364 = 0</span><br><br>Ask me any question about setting up consecutive numbers!`
        }
        return `🎯 <b>Step 2: Factoring & Discarding Negative Integers</b><br><br>Dividing by 2 gives <span class='font-mono'>x² + x − 182 = 0</span>, which factors into <span class='font-mono font-bold text-[#4A7C59]'>(x + 14)(x − 13) = 0</span>.<br><br>💡 Since the problem specifies <i>positive integers</i>, we discard x = -14 and keep <b>x = 13</b> (next integer is <b>14</b>)!`
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
      if (isRocket) return 'Select flight time <span class="font-mono font-medium">t</span> (in seconds) on the right to track rocket height.'
      if (isConsecutive) return 'Select an integer <span class="font-mono font-medium">x</span> on the right to evaluate sum of squares <span class="font-mono">x² + (x+1)²</span>.'
      return 'Select a breadth value <span class="font-mono font-medium">x</span> (in meters) to begin exploring the dimensions and area.'
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
      : typeof A === 'number' && A < 528
      ? `Breadth <b>x = ${currentX} m</b> (Length = ${L} m) gives <b>Area = ${A} m²</b>, which is <i>smaller</i> than target 528 m². Try increasing breadth!`
      : `Breadth <b>x = ${currentX} m</b> (Length = ${L} m) gives <b>Area = ${A} m²</b>, which is <i>larger</i> than target 528 m². Try decreasing breadth!`
  }, [currentPage, revealedStep, hasSelected, isRocket, isConsecutive, currentX, L, A, isCorrect])

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
          ? 'Explore consecutive integers! Select integer <span class="font-mono font-medium">x</span> from <span class="font-mono bg-white/70 border border-[#FDE68A] px-1 rounded">(10, 13, 15, 16)</span> on the right such that <span class="font-mono">x² + (x+1)² = 365</span>.'
          : 'Welcome! Drag the breadth slider or select a preset <span class="inline-block bg-[#F6F1E6] border border-black/10 rounded-md px-2 py-0.5 font-mono font-bold text-[#4A7C59] text-xs">(10, 16, 20, 24)</span> on the right to test your first breadth <span class="font-mono font-bold text-[#4A7C59]">(x)</span>.'
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
            ? 'Find two consecutive positive integers x (1st integer) and x+1 (2nd integer) such that sum of their squares equals 365.'
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F6F1E6] text-[#111814] border border-[#EDE8DD] text-[11px] font-medium cursor-pointer transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3 h-3" /> Return to Problem
            </button>
          </div>
        ) : null
      }
    >
      {currentPage === 'problem' ? (
        /* INTERACTIVE ALGEBRA TILES WORKSPACE (TOKEN SHEET v4 BEFORE -> AFTER) */
        <div className="relative z-10 flex flex-col flex-1 w-full">
          {/* Header */}
          <div className="text-center pt-8 pb-4 px-6">
            <h1 className="font-display font-bold text-[24px] leading-[1.1] tracking-tight text-[#111814]">
              {isRocket
                ? 'Visualise Rocket Trajectory'
                : isConsecutive
                ? 'Visualise Consecutive Squares'
                : 'Visualise the Park'}
            </h1>
            <div className="mt-2 font-mono text-[10px] tracking-[0.12em] text-[#6B7280] uppercase">
              {isRocket
                ? 'DRAG OR USE PRESETS · FIND LANDING TIME (h = 0)'
                : isConsecutive
                ? 'DRAG OR USE PRESETS · SUM MUST EQUAL 365'
                : 'DRAG OR USE PRESETS · AREA MUST EQUAL 528'}
            </div>
          </div>

          {/* Center Visuals: Dashed Box + Calculations Column */}
          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-10 px-6 py-4">
            {/* Dashed Dimension Box: White #FFFFFF 180×180, 1.5px dashed #D6D0C2, radius 16px, shadow-card, ? now Newsreader 32px 700 */}
            <div className="relative">
              <div className="w-[180px] h-[180px] rounded-[16px] bg-white border-[1.5px] border-dashed border-[#D6D0C2] shadow-card flex flex-col items-center justify-between py-4 relative">
                <div className="font-mono text-[10px] tracking-[0.12em] text-[#9CA3AF] uppercase">
                  {isRocket ? 'TIME (t)' : isConsecutive ? 'INTEGER (x)' : 'BREADTH (x)'}
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <span className="font-display font-bold text-[32px] text-[#111814] tracking-tight">
                    {hasSelected ? currentX : '?'}
                  </span>
                </div>
                <div className="font-mono text-[10px] tracking-[0.12em] text-[#9CA3AF]">
                  {isRocket ? 'seconds' : isConsecutive ? 'integer' : 'meters'}
                </div>
                <div className="absolute -top-2 -right-2 h-[22px] px-2 rounded-full bg-white border border-[#EDE8DD] shadow-sm font-mono text-[10px] flex items-center text-[#6B7280]">
                  {isRocket ? '+25m' : '+1'}
                </div>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-10 w-8 h-px bg-[#E2DDD1] border-t border-dashed border-[#D6D0C2]" />
            </div>

            {/* Calculations Column */}
            <div className="flex flex-col gap-4 w-full max-w-[300px]">
              {/* Card 1: Next = (x+1) = */}
              <div className="rounded-[12px] bg-white border border-[#EDE8DD] shadow-card px-5 py-3 flex items-center justify-between">
                <span className="font-mono text-[13px] text-[#111814]">
                  {isRocket ? 'Height h(t) =' : isConsecutive ? 'Next = (x+1) =' : 'Length = 2x + 1 ='}
                </span>
                <span
                  className={`ml-2 h-[28px] min-w-[48px] px-2 rounded-[8px] border border-dashed flex items-center justify-center font-mono text-[13px] ${
                    hasSelected
                      ? 'bg-[#F6F1E6] border-[#E2DDD1] text-[#111814]'
                      : 'bg-[#FBF9F3] border-[#EDE8DD] text-[#9CA3AF]'
                  }`}
                >
                  {hasSelected ? L : '?'}
                </span>
              </div>

              {/* Card 2: Formula / Sum / Area */}
              <div
                className={`rounded-[12px] border shadow-card px-5 py-3 flex items-center justify-between transition-colors ${
                  isCorrect ? 'bg-[#F0FDF4] border-[#BBF7D0]' : 'bg-white border-[#EDE8DD]'
                }`}
              >
                <span className="font-mono text-[13px] text-[#111814]">
                  {isRocket ? 'h(t) =' : isConsecutive ? 'x²+(x+1)² =' : 'Area = x·(2x+1) ='}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-[28px] min-w-[64px] px-3 rounded-[8px] border border-dashed flex items-center justify-center font-mono text-[13px] font-medium ${
                      isCorrect
                        ? 'bg-white border-[#BBF7D0] text-[#4A7C59]'
                        : hasSelected
                        ? 'bg-[#FBF9F3] border-[#EDE8DD] text-[#111814]'
                        : 'bg-[#FBF9F3] border-[#EDE8DD] text-[#9CA3AF]'
                    }`}
                  >
                    {hasSelected ? A : '?'}
                  </span>
                  {isCorrect && <span className="text-[#4A7C59] font-bold">✓</span>}
                  {hasSelected && !isCorrect && <span className="text-[#D6D0C2]">✕</span>}
                </div>
              </div>

              {/* Green notification banner on match */}
              {isCorrect && (
                <div className="rounded-[10px] bg-[#4A7C59] text-white px-3 py-2 font-mono text-[11px] flex items-center gap-2 animate-[fadeIn_0.3s]">
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </span>
                  <span>
                    {isConsecutive
                      ? 'Perfect! 13² + 14² = 169 + 196 = 365'
                      : isRocket
                      ? 'Perfect! Rocket landed at t = 5 s (h = 0 m)'
                      : 'Perfect! Breadth 16 m × Length 33 m = 528 m²'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Presets: 32px height, bg #F6F1E6 inactive, active black #1A221E white with check */}
          <div className="px-6 lg:px-10 py-3 flex flex-wrap items-center justify-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.12em] text-[#9CA3AF]">
              PRESETS:
            </span>
            {presetValues.map((val) => {
              const isPresetActive = x === val
              return (
                <button
                  key={val}
                  onClick={() => handleSliderChange(val)}
                  className={`h-[32px] px-[14px] rounded-full border text-[13px] font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    isPresetActive
                      ? 'bg-[#1A221E] text-white border-[#1A221E] shadow-sm'
                      : 'bg-[#F6F1E6] text-[#6B7280] border-[#EDE8DD] hover:bg-white'
                  }`}
                >
                  {isPresetActive && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3.5 8L6.5 11L12.5 5"
                        stroke="white"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <span>{val}</span>
                </button>
              )
            })}
          </div>

          {/* Slider + CTA: Full control card 16px radius, custom track #EDE8DD 4px, thumb #1A221E 20px, value pill Unset -> 13 */}
          <div className="px-6 lg:px-10 pb-8 mt-auto w-full">
            <div className="mx-auto max-w-[640px] rounded-[16px] bg-white border border-[#EDE8DD] shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] tracking-[0.12em] text-[#6B7280] uppercase">
                  {isRocket ? 'FLIGHT TIME (t):' : isConsecutive ? 'INTEGER (x):' : 'BREADTH (x):'}
                </span>
                <span
                  className={`h-[24px] px-2.5 rounded-full text-[11px] font-medium font-mono flex items-center ${
                    hasSelected
                      ? 'bg-[#1A221E] text-white'
                      : 'bg-[#F6F1E6] text-[#6B7280] border border-[#EDE8DD]'
                  }`}
                >
                  {hasSelected ? currentX : 'Unset'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSliderChange(Math.max(sliderMinVal, (x ?? defaultVal) - 1))}
                  className="w-9 h-9 rounded-[10px] border border-[#EDE8DD] bg-white flex items-center justify-center hover:bg-[#FBF9F3] transition-colors shrink-0 cursor-pointer"
                  title="Decrease"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16">
                    <path d="M3 8H13" stroke="#111814" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>

                <div className="flex-1 relative py-2 select-none">
                  <div
                    ref={trackRef}
                    onMouseDown={(e) => {
                      setIsDragging(true)
                      updateSliderFromClientX(e.clientX)
                    }}
                    onTouchStart={(e) => {
                      setIsDragging(true)
                      updateSliderFromClientX(e.touches[0].clientX)
                    }}
                    className="relative h-[20px] flex items-center cursor-pointer group"
                  >
                    <div className="absolute left-0 right-0 h-[4px] rounded-full bg-[#EDE8DD]" />
                    <div
                      className="absolute left-0 h-[4px] rounded-full bg-[#1A221E] transition-all"
                      style={{
                        width: `${
                          hasSelected
                            ? ((currentX - sliderMinVal) / (sliderMaxVal - sliderMinVal)) * 100
                            : 0
                        }%`,
                      }}
                    />
                    <div
                      className="absolute w-[20px] h-[20px] rounded-full bg-[#1A221E] border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.2)] cursor-grab active:cursor-grabbing transition-transform group-active:scale-110"
                      style={{
                        left: `calc(${
                          hasSelected
                            ? ((currentX - sliderMinVal) / (sliderMaxVal - sliderMinVal)) * 100
                            : 0
                        }% - 10px)`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 font-mono text-[10px] text-[#9CA3AF]">
                    <span>{sliderMinVal}{isRocket ? 's' : isConsecutive ? '' : 'm'}</span>
                    <span>{Math.round(sliderMinVal + (sliderMaxVal - sliderMinVal) * 0.33)}{isRocket ? 's' : isConsecutive ? '' : 'm'}</span>
                    <span>{Math.round(sliderMinVal + (sliderMaxVal - sliderMinVal) * 0.67)}{isRocket ? 's' : isConsecutive ? '' : 'm'}</span>
                    <span>{sliderMaxVal}{isRocket ? 's' : isConsecutive ? '' : 'm'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSliderChange(Math.min(sliderMaxVal, (x ?? (defaultVal - 1)) + 1))}
                  className="w-9 h-9 rounded-[10px] border border-[#EDE8DD] bg-white flex items-center justify-center hover:bg-[#FBF9F3] transition-colors shrink-0 cursor-pointer"
                  title="Increase"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16">
                    <path d="M8 3V13M3 8H13" stroke="#111814" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Check & View Factorization Solution: Beige disabled until sum === 365, then active black */}
              <button
                disabled={!isCorrect}
                onClick={navigateToFactorization}
                className={`mt-5 w-full h-[44px] rounded-[12px] border text-[13px] font-medium flex items-center justify-center gap-2 transition-all ${
                  isCorrect
                    ? 'bg-[#1A221E] text-white border-[#1A221E] shadow-sm hover:bg-black cursor-pointer'
                    : 'bg-[#F6F1E6] text-[#9CA3AF] border-[#EDE8DD] cursor-not-allowed'
                }`}
              >
                <span>Check & View Factorization Solution</span>
                <span className={`transition-colors ${isCorrect ? 'text-white' : 'text-[#9CA3AF]'}`}>
                  {isCorrect ? '→' : '↗'}
                </span>
              </button>

              {!isCorrect && hasSelected && (
                <div className="mt-3 text-center font-mono text-[10px] text-[#9CA3AF]">
                  {isConsecutive ? (
                    `Try ${currentX}² + ${currentX + 1}² = ${A} ≠ 365 · Keep exploring`
                  ) : isRocket ? (
                    `Try t = ${currentX}s, h(t) = ${A}m ≠ 0m · Keep exploring`
                  ) : (
                    `Try ${currentX} × ${2 * currentX + 1} = ${A} ≠ 528 · Keep exploring`
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* STEP-WISE FACTORIZATION VIEW (TOKEN SHEET v4 STYLED) */
        <div className="w-full max-w-4xl bg-white border border-[#EDE8DD] rounded-[18px] p-6 md:p-10 space-y-7 shadow-card font-sans leading-relaxed my-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#EDE8DD] pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#6B7280] bg-[#F6F1E6] px-3 py-1 rounded-full border border-[#EDE8DD]">
                  Step-by-Step Factorization (AC Method)
                </span>
                <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#E6F0E8] text-[#2E5A3A] font-semibold border border-[#BBF7D0]">
                  Step {revealedStep} of 4
                </span>
              </div>
              <h2 className="font-serif text-[22px] md:text-[26px] font-[600] text-[#111814] mt-2.5">
                {isRocket
                  ? 'Factorization of -5t² + 20t + 25 = 0'
                  : isConsecutive
                  ? 'Factorization of 2x² + 2x − 364 = 0'
                  : 'Factorization of 2x² + x − 528 = 0'}
              </h2>
            </div>
            <button
              onClick={navigateToProblem}
              className="text-[12px] font-medium px-4 py-2 rounded-full bg-[#F6F1E6] hover:bg-[#EDE8DD] border border-[#EDE8DD] text-[#111814] transition-colors cursor-pointer"
            >
              Back to Problem
            </button>
          </div>

          {/* Derivation Steps */}
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="space-y-2.5 p-5 rounded-[16px] bg-[#FBF9F3] border border-[#EDE8DD]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[14px] md:text-[15px] font-[600] text-[#111814]">
                  <span className="w-7 h-7 rounded-full bg-[#1A221E] text-white flex items-center justify-center text-[12px] font-mono font-bold">1</span>
                  <span>Formulating Standard Quadratic Form</span>
                </div>
                <span className="text-[11px] font-mono text-[#6B7280] bg-white border border-[#EDE8DD] px-2.5 py-1 rounded-md">ax² + bx + c = 0</span>
              </div>
              <p className="text-[13px] text-[#6B7280] pl-9.5">
                {isRocket
                  ? 'Setting ground landing condition height h(t) = 0:'
                  : isConsecutive
                  ? 'Sum of squares of two consecutive integers x and x + 1:'
                  : 'Given Area = 528 m², Breadth = x, and Length = 2x + 1:'}
              </p>
              <div className="ml-9.5 bg-white border border-[#EDE8DD] rounded-[12px] p-3.5 font-mono text-[13px] md:text-[14px] flex items-center justify-between shadow-xs">
                <span className="text-[#6B7280]">
                  {isRocket ? 'h(t) = -5t² + 20t + 25' : isConsecutive ? 'x² + (x + 1)² = 365' : 'x · (2x + 1) = 528'}
                </span>
                <span className="text-[#111814] font-bold">
                  {isRocket ? '-5t² + 20t + 25 = 0' : isConsecutive ? '2x² + 2x − 364 = 0' : '2x² + x − 528 = 0'}
                </span>
              </div>
            </div>

            {/* Step 2 */}
            {revealedStep >= 2 && (
              <div className="space-y-2.5 p-5 rounded-[16px] bg-[#FBF9F3] border border-[#EDE8DD]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-[14px] md:text-[15px] font-[600] text-[#111814]">
                    <span className="w-7 h-7 rounded-full bg-[#1A221E] text-white flex items-center justify-center text-[12px] font-mono font-bold">2</span>
                    <span>Splitting the Middle Term (AC Method)</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#6B7280] bg-white border border-[#EDE8DD] px-2.5 py-1 rounded-md">
                    {isConsecutive ? 'a · c = -182' : isRocket ? 'a · c = -5' : 'a · c = -1056'}
                  </span>
                </div>
                <p className="text-[13px] text-[#6B7280] pl-9.5">
                  {isConsecutive ? (
                    <>Dividing by 2 gives <b>x² + x − 182 = 0</b>. Find two numbers whose product is -182 and sum is +1:</>
                  ) : isRocket ? (
                    <>Factoring out -5 gives <b>-5(t² − 4t − 5) = 0</b>. Find two numbers whose product is -5 and sum is -4:</>
                  ) : (
                    <>Multiply a × c = 2 × (-528) = <b>-1056</b>. Find two numbers whose product is -1056 and sum is +1:</>
                  )}
                </p>
                <div className="ml-9.5 bg-white border border-[#EDE8DD] rounded-[12px] p-3.5 font-mono text-[13px] md:text-[14px] text-[#111814] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#6B7280]">Factors:</span>
                    <span className="px-3 py-1 rounded bg-[#E6F0E8] text-[#2E5A3A] border border-[#BBF7D0] font-bold">
                      {isConsecutive ? '+14' : isRocket ? '+1' : '+33'}
                    </span>
                    <span className="px-3 py-1 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] font-bold">
                      {isConsecutive ? '-13' : isRocket ? '-5' : '-32'}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#6B7280]">
                    {isConsecutive
                      ? '(14) × (-13) = -182  |  14 − 13 = +1'
                      : isRocket
                      ? '(1) × (-5) = -5  |  1 − 5 = -4'
                      : '(33) × (-32) = -1056  |  33 − 32 = +1'}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {revealedStep >= 3 && (
              <div className="space-y-2.5 p-5 rounded-[16px] bg-[#FBF9F3] border border-[#EDE8DD]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-[14px] md:text-[15px] font-[600] text-[#111814]">
                    <span className="w-7 h-7 rounded-full bg-[#1A221E] text-white flex items-center justify-center text-[12px] font-mono font-bold">3</span>
                    <span>Factor by Grouping</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#6B7280] bg-white border border-[#EDE8DD] px-2.5 py-1 rounded-md">Common Binomial</span>
                </div>
                <div className="ml-9.5 bg-white border border-[#EDE8DD] rounded-[12px] p-3.5 font-mono text-[13px] md:text-[14px] text-[#111814] space-y-2 shadow-xs">
                  {isConsecutive ? (
                    <>
                      <div className="text-[#6B7280]">x² + 14x − 13x − 182 = 0</div>
                      <div className="text-[#111814]">x(x + 14) − 13(x + 14) = 0</div>
                      <div className="pt-2 border-t border-[#EDE8DD] text-[#111814] font-bold">
                        (x + 14)(x − 13) = 0
                      </div>
                    </>
                  ) : isRocket ? (
                    <>
                      <div className="text-[#6B7280]">-5(t² − 5t + 1t − 5) = 0</div>
                      <div className="text-[#111814]">-5[t(t − 5) + 1(t − 5)] = 0</div>
                      <div className="pt-2 border-t border-[#EDE8DD] text-[#111814] font-bold">
                        -5(t − 5)(t + 1) = 0
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-[#6B7280]">2x² + 33x − 32x − 528 = 0</div>
                      <div className="text-[#111814]">x(2x + 33) − 16(2x + 33) = 0</div>
                      <div className="pt-2 border-t border-[#EDE8DD] text-[#111814] font-bold">
                        (2x + 33)(x − 16) = 0
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 4 */}
            {revealedStep >= 4 && (
              <div className="space-y-2.5 p-5 rounded-[16px] bg-[#FBF9F3] border border-[#EDE8DD]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-[14px] md:text-[15px] font-[600] text-[#111814]">
                    <span className="w-7 h-7 rounded-full bg-[#1A221E] text-white flex items-center justify-center text-[12px] font-mono font-bold">4</span>
                    <span>Roots & Real-World Validation</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#2E5A3A] bg-[#E6F0E8] border border-[#BBF7D0] px-2.5 py-1 rounded-md font-bold">Validated</span>
                </div>
                <div className="ml-9.5 space-y-3">
                  <div className="bg-white border border-[#EDE8DD] rounded-[12px] p-3.5 font-mono text-[13px] md:text-[14px] text-[#111814] shadow-xs">
                    {isConsecutive ? (
                      'x + 14 = 0 → x = -14  |  x − 13 = 0 → x = 13'
                    ) : isRocket ? (
                      't − 5 = 0 → t = 5 s  |  t + 1 = 0 → t = -1 s'
                    ) : (
                      '2x + 33 = 0 → x = -33/2 = -16.5  |  x − 16 = 0 → x = 16'
                    )}
                  </div>
                  <div className="p-3 rounded-[12px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[12px] font-mono flex items-center gap-2.5">
                    <span className="font-bold">
                      {isConsecutive ? '✕ Discard x = -14' : isRocket ? '✕ Discard t = -1 s' : '✕ Discard x = -16.5'}
                    </span>
                    <span className="text-[#991B1B]/80 font-sans">
                      {isConsecutive
                        ? '(Problem specifies positive integers)'
                        : isRocket
                        ? '(Flight time cannot be negative)'
                        : '(Breadth cannot be negative in physical geometry)'}
                    </span>
                  </div>
                  <div className="p-4 rounded-[12px] bg-[#E6F0E8] border border-[#BBF7D0] text-[#2E5A3A] font-bold font-mono text-[13px] md:text-[14px] flex flex-wrap items-center justify-between gap-3 shadow-xs">
                    {isConsecutive ? (
                      <>
                        <span>✓ First Integer (x) = 13</span>
                        <span>Next Integer (x + 1) = 14</span>
                        <span className="text-[#111814] font-black">13² + 14² = 365</span>
                      </>
                    ) : isRocket ? (
                      <>
                        <span>✓ Landing Time (t) = 5 seconds</span>
                        <span>Ground Height h(5) = 0 m</span>
                        <span className="text-[#111814] font-black">Apex Vertex = 45 m</span>
                      </>
                    ) : (
                      <>
                        <span>✓ Breadth (x) = 16 m</span>
                        <span>Length (2x + 1) = 33 m</span>
                        <span className="text-[#111814] font-black">Area = 528 m²</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Navigation Controls */}
          <div className="pt-3 flex flex-col sm:flex-row gap-3.5">
            {revealedStep < 4 ? (
              <>
                <button
                  onClick={() => setRevealedStep((s) => s + 1)}
                  className="flex-1 h-11 px-7 rounded-full bg-[#1A221E] hover:bg-black text-white font-[600] text-[13px] md:text-[14px] shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
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
                  className="h-11 px-6 rounded-full bg-[#F6F1E6] hover:bg-[#EDE8DD] border border-[#EDE8DD] text-[#111814] font-medium text-[13px] cursor-pointer transition-all"
                >
                  Show All Steps
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={solveAnotherProblem}
                  className="flex-1 h-11 px-7 rounded-full bg-[#1A221E] hover:bg-black text-white font-[600] text-[13px] md:text-[14px] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Solve Another Problem</span>
                </button>
                <button
                  onClick={navigateToProblem}
                  className="h-11 px-6 rounded-full bg-[#F6F1E6] hover:bg-[#EDE8DD] border border-[#EDE8DD] text-[#111814] font-medium text-[13px] cursor-pointer transition-all"
                >
                  Back to Workspace
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </SocraticSplitLayout>
  )
}
