import { useState, useEffect } from 'react'
import { ArrowLeft, ChevronRight, Maximize, Minimize } from 'lucide-react'
import {
  AlgebraTileBlock,
  DataSetBlock,
  ProjectileBlock,
  TitrationBlock,
  AngleAroundPointBlock,
  AreaFractionBlock,
} from '../simulation-blocks'

export interface SimulationItem {
  id: string
  title: string
  equation: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  theme: string
  time: string
  points: number
  status: 'Solved ✓' | 'In Progress' | 'New' | 'No Simulation Added'
  chapterId: string
  subtopicId: string
  subjectId: string
  desc: string
  blockType: 'algebra-tile' | 'dataset' | 'projectile' | 'titration' | 'angles' | 'area-fraction'
  hasSimulation: boolean
}

export const LAB_CATALOG: SimulationItem[] = [
  {
    id: 'quad-park',
    title: 'Park Area Optimization (528 m²)',
    equation: '2x² + x - 528 = 0',
    difficulty: 'Intermediate',
    theme: 'Geometry & Algebra',
    time: '6 min',
    points: 100,
    status: 'Solved ✓',
    chapterId: 'algebra',
    subtopicId: 'quadratic-equations',
    subjectId: 'maths',
    desc: 'Solve real-world rectangular area problem: length is 1 more than twice the breadth.',
    blockType: 'algebra-tile',
    hasSimulation: true,
  },
  {
    id: 'quad-rocket',
    title: 'Model Rocket Flight Path',
    equation: 'h(t) = -5t² + 20t + 25',
    difficulty: 'Advanced',
    theme: 'Kinematics & Algebra',
    time: '8 min',
    points: 120,
    status: 'New',
    chapterId: 'algebra',
    subtopicId: 'quadratic-equations',
    subjectId: 'maths',
    desc: 'Analyze vertical projectile motion, maximum height apex, and landing time.',
    blockType: 'algebra-tile',
    hasSimulation: true,
  },
  {
    id: 'quad-consecutive',
    title: 'Consecutive Integer Squares',
    equation: 'x² + (x+1)² = 365',
    difficulty: 'Intermediate',
    theme: 'Number Theory',
    time: '5 min',
    points: 90,
    status: 'In Progress',
    chapterId: 'algebra',
    subtopicId: 'quadratic-equations',
    subjectId: 'maths',
    desc: 'Find two consecutive positive integers whose sum of squares equals 365.',
    blockType: 'algebra-tile',
    hasSimulation: true,
  },
  {
    id: 'phys-projectile-sim',
    title: 'Projectile Launch & Trajectory',
    equation: 'R = (v₀² · sin 2θ) / g',
    difficulty: 'Intermediate',
    theme: 'Mechanics',
    time: '7 min',
    points: 110,
    status: 'New',
    chapterId: 'physics',
    subtopicId: 'projectile-motion',
    subjectId: 'science',
    desc: 'Adjust launch angle θ and initial velocity to discover optimal range trajectories.',
    blockType: 'projectile',
    hasSimulation: true,
  },
  {
    id: 'chem-titration-sim',
    title: 'Acid-Base Titration & pH Curve',
    equation: 'HCl + NaOH → NaCl + H₂O',
    difficulty: 'Advanced',
    theme: 'Physical Chemistry',
    time: '10 min',
    points: 150,
    status: 'New',
    chapterId: 'chemistry',
    subtopicId: 'titration',
    subjectId: 'science',
    desc: '50 mL 0.1M HCl analyte titrated with 0.1M NaOH. Identify the equivalence transition point.',
    blockType: 'titration',
    hasSimulation: true,
  },
  {
    id: 'geom-angles-point',
    title: 'Angles Around a Point (360°)',
    equation: 'Σ θᵢ = 360°',
    difficulty: 'Beginner',
    theme: 'Euclidean Geometry',
    time: '4 min',
    points: 70,
    status: 'New',
    chapterId: 'geometry',
    subtopicId: 'circles',
    subjectId: 'maths',
    desc: 'Partition angular sectors around a center point to verify the 360-degree sum rule.',
    blockType: 'angles',
    hasSimulation: true,
  },
  {
    id: 'mens-fraction-area',
    title: 'Fractional Area Proportions',
    equation: 'Area Fraction = n / d',
    difficulty: 'Beginner',
    theme: 'Mensuration',
    time: '4 min',
    points: 60,
    status: 'New',
    chapterId: 'mensuration',
    subtopicId: 'circle-areas',
    subjectId: 'maths',
    desc: 'Manipulate numerator and denominator sliders to visualize fraction areas on geometric shapes.',
    blockType: 'area-fraction',
    hasSimulation: true,
  },
  {
    id: 'stats-data-points',
    title: 'Central Tendency & Mean Value',
    equation: 'x̄ = (Σ xᵢ) / n',
    difficulty: 'Beginner',
    theme: 'Statistics',
    time: '5 min',
    points: 80,
    status: 'New',
    chapterId: 'statistics-prob',
    subtopicId: 'stats-mean',
    subjectId: 'maths',
    desc: 'Dynamically add and shift data points to observe shifts in arithmetic mean and median.',
    blockType: 'dataset',
    hasSimulation: true,
  },
]

const PARK_JSON = {
  id: 'quad-park-528',
  meta: {
    title: 'Quadratic Equations: Real-World Rectangular Area Problem',
    standard: 'CBSE Class 10 Mathematics',
    chapter: 'Chapter 4: Quadratic Equations',
    topic: 'Mathematical Modeling and Algebraic Factorization',
  },
  content: {
    prompt:
      'The area of a rectangular park is 528 m². The length of the plot (in metres) is one more than twice its breadth. Find the length and breadth of the plot.',
  },
  algebra: {
    target: 528,
    slider: {
      min: 10,
      max: 25,
      default: 16,
    },
  },
}

interface SocraticLabEmbedProps {
  initialSimId?: string
  tierLevel?: number
  onBack?: () => void
}

export default function SocraticLabEmbed({
  initialSimId = 'quad-park',
  onBack,
}: SocraticLabEmbedProps) {
  const [activeSim, setActiveSim] = useState<SimulationItem>(() => {
    return LAB_CATALOG.find((s) => s.id === initialSimId) || LAB_CATALOG[0]
  })
  const [activeProblemKey, setActiveProblemKey] = useState<string>(
    initialSimId === 'quad-rocket' ? 'rocket' : initialSimId === 'quad-consecutive' ? 'consecutive' : 'park',
  )
  const [sessionKey, setSessionKey] = useState<string>(() => `sess-${initialSimId}-${Date.now()}`)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // ESC key listener to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  const handleSwitchProblem = (key: 'park' | 'rocket' | 'consecutive') => {
    setActiveProblemKey(key)
    const targetId = key === 'rocket' ? 'quad-rocket' : key === 'consecutive' ? 'quad-consecutive' : 'quad-park'
    const found = LAB_CATALOG.find((s) => s.id === targetId)
    if (found) setActiveSim(found)
    setSessionKey(`sess-${key}-${Date.now()}`)
  }

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-cream text-forest flex flex-col h-screen w-screen overflow-hidden font-ui'
          : 'bg-cream text-forest flex flex-col h-full overflow-hidden font-ui'
      }
    >
      {/* Top Context Bar in SaaS styling */}
      <div className="h-[60px] bg-white border-b border-black/[0.08] px-4 lg:px-6 flex items-center justify-between z-30 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="h-9 px-3.5 rounded-xl bg-forest hover:bg-forest-raised text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          <div className="text-[12px] text-forest/60 hidden sm:flex items-center gap-1.5 font-medium">
            <span className="capitalize">{activeSim.subjectId}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <span className="capitalize">{activeSim.chapterId.replace('-', ' ')}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <span className="text-forest font-semibold">{activeSim.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Multi-Problem Switcher for Quadratics */}
          {activeSim.subtopicId === 'quadratic-equations' && (
            <div className="flex items-center gap-1 bg-cream p-1 rounded-xl border border-black/10 text-[12px]">
              <button
                onClick={() => handleSwitchProblem('park')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeProblemKey === 'park'
                    ? 'bg-forest text-white font-semibold shadow-sm'
                    : 'text-forest/70 hover:text-forest'
                }`}
              >
                <span>1. Park Area</span>
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold">✓</span>
              </button>
              <button
                onClick={() => handleSwitchProblem('rocket')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeProblemKey === 'rocket'
                    ? 'bg-forest text-white font-semibold shadow-sm'
                    : 'text-forest/70 hover:text-forest'
                }`}
              >
                2. Rocket Path
              </button>
              <button
                onClick={() => handleSwitchProblem('consecutive')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeProblemKey === 'consecutive'
                    ? 'bg-forest text-white font-semibold shadow-sm'
                    : 'text-forest/70 hover:text-forest'
                }`}
              >
                3. Number Sum
              </button>
            </div>
          )}

          {/* Fullscreen / Immersive Mode Toggle */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="h-9 px-3 rounded-xl border border-black/10 bg-white hover:bg-black/5 text-forest text-[12px] font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Immersive Fullscreen'}
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Simulation Block Render */}
      <div className="flex-1 overflow-hidden">
        {activeSim.id === 'quad-park' ||
        activeSim.id === 'quad-rocket' ||
        activeSim.id === 'quad-consecutive' ? (
          <AlgebraTileBlock
            key={sessionKey}
            json={
              activeProblemKey === 'rocket' || activeSim.id === 'quad-rocket'
                ? {
                    id: 'quad-rocket-sim',
                    content: {
                      prompt:
                        'A model rocket is launched vertically. Its height is h(t) = -5t² + 20t + 25. Find the landing time (h=0) and max height vertex.',
                    },
                    algebra: {
                      target: 25,
                      slider: { min: 0, max: 10, default: 5 },
                    },
                  }
                : activeProblemKey === 'consecutive' || activeSim.id === 'quad-consecutive'
                ? {
                    id: 'quad-consec-sim',
                    content: {
                      prompt:
                        'Find two consecutive positive integers x and (x+1) such that the sum of their squares is 365: x² + (x+1)² = 365.',
                    },
                    algebra: {
                      target: 365,
                      slider: { min: 5, max: 20, default: 13 },
                    },
                  }
                : PARK_JSON
            }
          />
        ) : activeSim.id === 'stats-data-points' ? (
          <DataSetBlock
            key={sessionKey}
            json={{
              id: 'stats-dataset-block',
              content: {
                prompt: 'Data points: 4, 8, 6, 5, 12 - Analyze Central Tendency and Mean value.',
              },
              stats: { data: [4, 8, 6, 5, 12] },
            }}
          />
        ) : activeSim.id === 'phys-projectile-sim' ? (
          <ProjectileBlock
            key={sessionKey}
            json={{
              id: 'phys-projectile-block',
              content: {
                prompt:
                  'Initial Velocity = 20 m/s. Adjust launch angle θ to discover maximum projectile range.',
              },
            }}
          />
        ) : activeSim.id === 'chem-titration-sim' ? (
          <TitrationBlock
            key={sessionKey}
            json={{
              id: 'chem-titration-block',
              content: {
                prompt:
                  '50 mL 0.1M HCl analyte + 0.1M NaOH titrant. Determine pH equivalence transition.',
              },
            }}
          />
        ) : activeSim.id === 'geom-angles-point' ? (
          <AngleAroundPointBlock
            key={sessionKey}
            json={{
              id: 'geom-angles-block',
              content: {
                prompt: 'Angles around a central point must sum to 360°. Adjust angle slices to verify.',
              },
            }}
          />
        ) : activeSim.id === 'mens-fraction-area' ? (
          <AreaFractionBlock
            key={sessionKey}
            json={{
              id: 'mens-fraction-block',
              content: {
                prompt:
                  'Fractional area coverage models. Adjust numerator and denominator to represent proportions.',
              },
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
