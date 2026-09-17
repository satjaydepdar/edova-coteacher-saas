import { useState } from 'react'
import { ArrowLeft, Construction } from 'lucide-react'
import { useWorkspace } from '../components/Shell'
import CurriculumCatalog from '../components/CurriculumCatalog'
import SocraticLabEmbed from '../components/SocraticLabEmbed'
import { SimulationItem } from '../data/curriculumData'

export default function Labs() {
  const { labSubject, labChapterId, setLabChapterId, labTopicId, setLabTopicId } = useWorkspace()

  // Navigation & View State
  const [activeSimulation, setActiveSimulation] = useState<SimulationItem | null>(null)
  const [unimplementedLabTitle, setUnimplementedLabTitle] = useState<string | null>(null)

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
    <div className="min-h-full w-full flex flex-col bg-[#FBF9F3] text-[#111814] font-sans antialiased selection:bg-[#DDB56E]/30">
      {/* View 1: Active Interactive Socratic Simulation */}
      {activeSimulation ? (
        <div className="flex-1 flex flex-col h-[calc(100vh-72px)] overflow-hidden">
          <SocraticLabEmbed
            initialSimId={activeSimulation.id}
            onBack={handleBackToCatalog}
          />
        </div>
      ) : unimplementedLabTitle ? (
        /* View 2: Unimplemented Lab Activity Notice in Token Sheet v4 card styling */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none min-h-[70vh]">
          <div className="max-w-md w-full bg-white rounded-[16px] border border-[#EDE8DD] p-8 shadow-card flex flex-col items-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-[12px] bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shadow-xs">
              <Construction className="w-7 h-7 text-[#92400E]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-[20px] font-[600] text-[#111814] tracking-tight">
                Simulation in development
              </h3>
              <p className="text-[13px] font-normal text-[#6B7280] leading-[1.6]">
                The interactive Socratic simulation for <span className="font-[600] text-[#111814]">"{unimplementedLabTitle}"</span> is currently being prepared for this curriculum.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleBackToCatalog}
                className="h-9 px-5 rounded-full bg-[#1A221E] hover:bg-black text-white text-[12px] font-[500] shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to catalog
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* View 3: 3-Level Natural Language Curriculum Discovery Portal */
        <div className="flex-1 flex flex-col min-h-full">
          <CurriculumCatalog
            activeSubject={labSubject}
            selectedChapterId={labChapterId === 'ALL' ? null : labChapterId}
            onSelectChapterId={(id) => setLabChapterId(id ?? 'ALL')}
            selectedSubTopicId={labTopicId === 'ALL' ? null : labTopicId}
            onSelectSubTopicId={(id) => setLabTopicId(id ?? 'ALL')}
            onLaunchSimulation={handleLaunchSimulation}
          />
        </div>
      )}
    </div>
  )
}
