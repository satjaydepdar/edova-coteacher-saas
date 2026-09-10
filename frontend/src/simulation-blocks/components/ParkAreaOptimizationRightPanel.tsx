import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight,
  Ruler,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Target
} from 'lucide-react'

export interface ParkAreaOptimizationRightPanelProps {
  initialX?: number
  targetArea?: number
  onSolve?: (breadth: number, length: number, area: number) => void
  onNavigateToDerivation?: () => void
  onEvent?: (event: { type: string; value: any; timestamp: number }) => void
}

export const PRESET_VALUES = [12, 14, 16, 18, 20, 24]

const HINTS = [
  {
    level: 1,
    title: 'Fundamental Geometry Formula',
    text: 'Remember, the area of any rectangle is given by Area = Length × Breadth.'
  },
  {
    level: 2,
    title: 'Algebraic Variable Substitution',
    text: 'Since Length is one more than twice the breadth (2x + 1), substitute into the equation: x · (2x + 1) = 528.'
  },
  {
    level: 3,
    title: 'Quadratic Standard Form & AC Method',
    text: 'Expand the expression to form standard quadratic form: 2x² + x - 528 = 0. Then factor by splitting the middle term using (+33) and (-32).'
  }
]

export default function ParkAreaOptimizationRightPanel({
  initialX = 14,
  targetArea = 528,
  onSolve,
  onNavigateToDerivation,
  onEvent
}: ParkAreaOptimizationRightPanelProps) {
  // State Management
  const [x, setX] = useState<number>(initialX)
  const [showFullWorking, setShowFullWorking] = useState<boolean>(false)
  const [activeHintLevel, setActiveHintLevel] = useState<number>(0)
  const [isAnimatingSubstitution, setIsAnimatingSubstitution] = useState<boolean>(false)

  // Derived Calculations
  const breadth = x
  const length = 2 * x + 1
  const calculatedArea = breadth * length
  const delta = calculatedArea - targetArea
  const isCorrect = calculatedArea === targetArea
  const isTooSmall = calculatedArea < targetArea
  const isNearSolution = Math.abs(x - 16) <= 1

  // Handle value changes with event logging & animation trigger
  const updateBreadth = (newX: number) => {
    const clamped = Math.max(1, Math.min(30, Math.round(newX)))
    setX(clamped)
    setIsAnimatingSubstitution(true)
    setTimeout(() => setIsAnimatingSubstitution(false), 400)

    onEvent?.({
      type: 'breadth-changed',
      value: clamped,
      timestamp: Date.now()
    })

    if (clamped === 16) {
      onSolve?.(16, 33, 528)
    }
  }

  // Normalized visual rectangle scaling
  const maxPossibleL = 2 * 30 + 1 // 61
  const maxPossibleB = 30 // 30
  const rectWidth = Math.min(340, Math.max(80, (length / maxPossibleL) * 320 + 40))
  const rectHeight = Math.min(160, Math.max(40, (breadth / maxPossibleB) * 130 + 25))

  // State-driven color palettes matching SaaS warm tones
  const colorTheme = useMemo(() => {
    if (isCorrect) {
      return {
        accent: '#10b981',
        border: 'border-emerald-500',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        badgeBg: 'bg-emerald-100',
        label: 'Exact Match'
      }
    }
    if (isTooSmall) {
      return {
        accent: '#0284c7',
        border: 'border-sky-400',
        bg: 'bg-sky-50',
        text: 'text-sky-800',
        badgeBg: 'bg-sky-100',
        label: 'Under Target'
      }
    }
    return {
      accent: '#e11d48',
      border: 'border-rose-400',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      badgeBg: 'bg-rose-100',
      label: 'Exceeds Target'
    }
  }, [isCorrect, isTooSmall])

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8 bg-cream text-forest flex flex-col gap-6 font-ui">
      
      {/* 1. Problem Header: Goal Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-[18px] bg-white border border-black/[0.08] p-5 shadow-card relative overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gold/20 text-gold text-xs">
            <Target className="w-3.5 h-3.5" />
          </span>
          <span className="text-[11px] font-bold tracking-wider uppercase text-forest/70">
            Goal of the Simulation
          </span>
        </div>
        <p className="text-[13px] md:text-[14px] text-forest/90 leading-relaxed font-medium">
          The area of a rectangular park is <strong className="font-bold text-forest">528 m²</strong>. The length of the plot (in metres) is <strong className="text-forest font-bold underline">one more than twice its breadth</strong>. Find the length and breadth of the plot.
        </p>
      </motion.div>

      {/* 2. Compact Variable Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-black/[0.06] rounded-xl px-4 py-3 text-[12px] font-medium shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span className="text-forest/60">Breadth:</span>
          <span className="text-sky-800 font-bold font-mono">x (meters)</span>
        </div>
        <div className="text-black/10 hidden sm:block">•</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-forest/60">Length:</span>
          <span className="text-rose-800 font-bold font-mono">2x + 1 (meters)</span>
        </div>
        <div className="text-black/10 hidden sm:block">•</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-forest/60">Target Area:</span>
          <span className="text-emerald-800 font-bold font-mono">528 m²</span>
        </div>
      </div>

      {/* 3. Centerpiece: Dynamic SVG Real-Time Park Visualization */}
      <div className="bg-white border border-black/[0.06] rounded-[18px] p-5 shadow-card flex flex-col gap-4 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-forest/70" />
            <span className="text-[12px] font-bold uppercase tracking-wider text-forest/70">
              Real-Time Geometric Park Visualizer
            </span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${colorTheme.badgeBg} ${colorTheme.text} border border-current/20`}>
            {colorTheme.label}
          </span>
        </div>

        {/* Interactive SVG Canvas */}
        <div className="relative w-full h-[250px] md:h-[280px] bg-cream-card rounded-xl border border-black/[0.06] flex items-center justify-center overflow-hidden shadow-inner select-none p-4">
          {/* Animated Resizing Park Rectangle */}
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            style={{
              width: `${rectWidth}px`,
              height: `${rectHeight}px`,
            }}
            className={`relative rounded-xl border-2 ${colorTheme.border} ${colorTheme.bg} flex flex-col items-center justify-center p-3 transition-colors duration-300 shadow-sm`}
          >
            {/* Top Dimension: Length (2x + 1) */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[11px] font-mono text-rose-900 font-bold bg-white border border-rose-200 px-2 py-0.5 rounded shadow-xs">
                Length = 2({breadth}) + 1 = <strong>{length} m</strong>
              </span>
            </div>

            {/* Right Dimension: Breadth (x) */}
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 rotate-90 flex items-center gap-1.5 whitespace-nowrap origin-center">
              <span className="text-[11px] font-mono text-sky-900 font-bold bg-white border border-sky-200 px-2 py-0.5 rounded shadow-xs">
                Breadth = <strong>{breadth} m</strong>
              </span>
            </div>

            {/* Park Interior Visual Content */}
            <div className="flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[11px] font-medium text-forest/60">
                Calculated Area
              </span>
              <motion.span
                key={calculatedArea}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`font-mono text-xl md:text-3xl font-black ${colorTheme.text} tracking-tight`}
              >
                {calculatedArea} m²
              </motion.span>
              <span className="text-[10px] font-mono text-forest/50 mt-0.5">
                ({breadth} m × {length} m)
              </span>
            </div>

            {/* Exact Match Check Icon Overlay */}
            {isCorrect && (
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white shadow-md"
              >
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Live Comparison Gauge Metric Bar */}
        <div className="bg-cream border border-black/[0.06] rounded-xl p-3.5 flex flex-col gap-2">
          <div className="flex justify-between items-center text-[12px] font-mono">
            <span className="text-forest/70">
              Area Comparison: <strong>{calculatedArea} m²</strong> vs <strong className="text-emerald-700">528 m²</strong>
            </span>
            <span className={`font-bold ${isCorrect ? 'text-emerald-700' : isTooSmall ? 'text-sky-700' : 'text-rose-700'}`}>
              {isCorrect ? '✓ Exact Match (Δ = 0 m²)' : delta > 0 ? `+${delta} m² Too Large` : `${delta} m² Too Small`}
            </span>
          </div>

          {/* Dual Progress Meter */}
          <div className="relative w-full h-2.5 bg-black/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-all duration-300 ${
                isCorrect ? 'bg-emerald-500' : isTooSmall ? 'bg-sky-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, (calculatedArea / targetArea) * 100)}%` }}
            />
          </div>

          {/* Contextual Encouragement Micro-Copy */}
          <div className="flex items-center gap-2 mt-1">
            {isCorrect ? (
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : isTooSmall ? (
              <TrendingUp className="w-4 h-4 text-sky-600 shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <p className={`text-[12px] font-medium ${isCorrect ? 'text-emerald-800' : 'text-forest/80'}`}>
              {isCorrect
                ? '🎉 Perfect! The park fits exactly. Breadth x = 16 m, Length = 33 m.'
                : isTooSmall
                ? 'The park is still too small. Try increasing the breadth (x).'
                : "You've exceeded the target area. Try a smaller breadth (x)."}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Equation Builder with Animated Substitution */}
      <div className="bg-white border border-black/[0.06] rounded-[18px] p-5 shadow-card flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <span className="text-[12px] font-bold uppercase tracking-wider text-forest/70">
            Interactive Equation Builder
          </span>
          <span className="text-[11px] font-mono text-forest/50">
            Area = Breadth · Length
          </span>
        </div>

        {/* Live Evaluated Math Expression with Animated Substitution */}
        <div className="bg-cream border border-black/[0.06] rounded-xl p-4 flex flex-wrap items-center justify-center gap-3 text-base md:text-lg font-mono">
          <span className="text-forest/60 font-bold">Area =</span>
          
          {/* Breadth (x) Pill */}
          <motion.span
            animate={isAnimatingSubstitution ? { scale: [1, 1.2, 1] } : {}}
            className="px-2.5 py-1 rounded-md bg-white border border-sky-300 text-sky-800 font-bold shadow-xs"
          >
            {breadth}
          </motion.span>
          
          <span className="text-forest/40">·</span>
          
          {/* Length (2x + 1) Pill */}
          <motion.span
            animate={isAnimatingSubstitution ? { scale: [1, 1.2, 1] } : {}}
            className="px-2.5 py-1 rounded-md bg-white border border-rose-300 text-rose-800 font-bold shadow-xs"
          >
            (2·<span className="text-sky-800">{breadth}</span> + 1)
          </motion.span>

          <span className="text-forest/40">=</span>

          <span className="text-forest font-bold">
            {breadth} · {length}
          </span>

          <span className="text-forest/40">=</span>

          {/* Result Tag */}
          <span
            className={`px-3 py-1 rounded-lg font-black font-mono text-lg md:text-xl transition-all shadow-xs ${
              isCorrect
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-white text-forest border border-black/10'
            }`}
          >
            {calculatedArea} m²
          </span>
        </div>

        {/* Expandable Step-by-Step Working Accordion */}
        <div className="border border-black/[0.06] rounded-xl overflow-hidden bg-cream">
          <button
            onClick={() => setShowFullWorking(!showFullWorking)}
            className="w-full px-4 py-3 flex items-center justify-between text-[12px] font-bold text-forest hover:bg-black/5 transition-colors cursor-pointer"
          >
            <span>Algebraic Step-by-Step Expansion</span>
            {showFullWorking ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <AnimatePresence>
            {showFullWorking && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 pt-1 text-[12px] font-mono border-t border-black/[0.06] flex flex-col gap-2.5 text-forest/80 bg-white"
              >
                <div>
                  <span className="text-forest/50">Step 1: </span>
                  <code>x(2x + 1) = 528</code>
                </div>
                <div>
                  <span className="text-forest/50">Step 2: </span>
                  <code>2x² + x = 528</code>
                </div>
                <div>
                  <span className="text-forest/50">Step 3: </span>
                  <code className="font-bold text-emerald-700">2x² + x − 528 = 0</code> (Standard Form)
                </div>
                <div>
                  <span className="text-forest/50">Step 4: </span>
                  <code>(2x + 33)(x − 16) = 0 → x = 16 m</code>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 5. Precise Slider Controller & Step Steppers */}
      <div className="bg-white border border-black/[0.06] rounded-[18px] p-5 shadow-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-forest/70">
            Dimension Controller
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[12px]">
            <span className="text-forest/60">Breadth (x):</span>
            <span className="text-forest font-bold px-2 py-0.5 rounded bg-cream border border-black/10">
              {breadth} m
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => updateBreadth(x - 1)}
            disabled={x <= 1}
            className="w-9 h-9 rounded-xl bg-cream hover:bg-cream-border border border-black/10 flex items-center justify-center text-forest transition-colors cursor-pointer disabled:opacity-40"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={x}
            onChange={(e) => updateBreadth(Number(e.target.value))}
            className="flex-1"
          />

          <button
            onClick={() => updateBreadth(x + 1)}
            disabled={x >= 30}
            className="w-9 h-9 rounded-xl bg-cream hover:bg-cream-border border border-black/10 flex items-center justify-center text-forest transition-colors cursor-pointer disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Value Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-[11px] text-forest/50 font-medium mr-1">Presets:</span>
          {PRESET_VALUES.map((val) => (
            <button
              key={val}
              onClick={() => updateBreadth(val)}
              className={`px-3 py-1 rounded-xl text-[12px] font-mono font-medium transition-all cursor-pointer ${
                x === val
                  ? 'bg-forest text-white shadow-xs font-bold'
                  : 'bg-cream hover:bg-cream-border text-forest/80 border border-black/[0.06]'
              }`}
            >
              x = {val}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Action Button when Solved */}
      {isCorrect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pt-2"
        >
          <button
            onClick={onNavigateToDerivation}
            className="w-full py-3.5 rounded-xl bg-forest hover:bg-forest-raised text-white text-[13px] font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            <span>Review Full Socratic Factorization</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </div>
  )
}
