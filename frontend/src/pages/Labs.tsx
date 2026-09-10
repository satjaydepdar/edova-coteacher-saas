import { useState, useMemo } from 'react'
import { ArrowLeft, Construction } from 'lucide-react'
import { useWorkspace } from '../components/Shell'
import CurriculumCatalog from '../components/CurriculumCatalog'
import SocraticLabEmbed from '../components/SocraticLabEmbed'
import { SimulationItem } from '../data/curriculumData'

export default function Labs() {
  const { tree } = useWorkspace()

  // Navigation & View State
  const [activeSimulation, setActiveSimulation] = useState<SimulationItem | null>(null)
  const [unimplementedLabTitle, setUnimplementedLabTitle] = useState<string | null>(null)

  // Map workspace subject to curriculum key
  const currentSubject = useMemo<'maths' | 'science' | 'social' | 'english'>(() => {
    const name = (tree?.subject_name || '').toLowerCase()
    if (name.includes('science') || name.includes('physics') || name.includes('chem')) return 'science'
    if (name.includes('social')) return 'social'
    if (name.includes('english')) return 'english'
    return 'maths'
  }, [tree?.subject_name])

  const handleLaunchSimulation = (sim: SimulationItem) => {
    if (sim.hasSimulation) {
      setUnimplementedLabTitle(null)
      setActiveSimulation(sim)
    } else {
      setUnimplementedLabTitle(sim.title)
    }
  }

  const handleBackToCatalog = () => {
    setActiveSimulation(null)
    setUnimplementedLabTitle(null)
  }

  return (
    <div className="min-h-full w-full flex flex-col bg-cream text-[#111827] font-ui">
      {/* View 1: Active Interactive Socratic Simulation */}
      {activeSimulation ? (
        <div className="flex-1 flex flex-col h-[calc(100vh-72px)] overflow-hidden">
          <SocraticLabEmbed
            initialSimId={activeSimulation.id}
            onBack={handleBackToCatalog}
          />
        </div>
      ) : unimplementedLabTitle ? (
        /* View 2: Unimplemented Lab Activity Notice in SaaS card styling */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none min-h-[70vh]">
          <div className="max-w-md w-full bg-white rounded-[22px] border border-black/[0.06] p-8 md:p-10 shadow-card flex flex-col items-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-cream border border-black/[0.08] flex items-center justify-center text-3xl shadow-inner">
              <Construction className="w-8 h-8 text-gold" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-[20px] font-bold text-[#111827] tracking-[-0.015em]">
                Simulation in development
              </h3>
              <p className="text-[14px] font-normal text-[#4B5563] leading-[1.6]">
                The interactive Socratic simulation for <span className="font-semibold text-[#111827]">"{unimplementedLabTitle}"</span> is currently being prepared for this curriculum.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleBackToCatalog}
                className="h-10 px-6 rounded-xl bg-forest hover:bg-forest-raised text-white text-[13px] font-medium shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to catalog
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* View 3: 3-Level Natural Language Curriculum Discovery Portal */
        <div className="flex-1 flex flex-col min-h-full">
          <CurriculumCatalog
            activeSubject={currentSubject}
            onLaunchSimulation={handleLaunchSimulation}
          />
        </div>
      )}
    </div>
  )
}
