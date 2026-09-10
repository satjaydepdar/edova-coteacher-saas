import React, { useState } from 'react'
import { Sparkles, Network } from 'lucide-react'
import ConceptGraphModal, { DEFAULT_QUADRATIC_CONCEPTS, DEFAULT_AP_CONCEPTS } from './ConceptGraphModal'

interface KnowledgeGraphRoadmapProps {
  chapterId?: string
  chapterTitle?: string
  activeConceptId?: string
  masteredConceptIds?: string[]
  onSelectConcept?: (conceptId: string) => void
  onAskHermes?: (question: string) => void
}

const QUADRATIC_ROADMAP_NODES = [
  { id: 'QUAD-01', label: '1. Standard Form', formula: 'ax² + bx + c = 0', query: 'How do we write quadratic equations in standard form ax² + bx + c = 0?' },
  { id: 'QUAD-02', label: '2. Area Model', formula: 'Area = x · (2x+1)', query: 'How does the geometric algebra tile area model represent quadratic equations?' },
  { id: 'QUAD-03', label: '3. AC Method', formula: 'ac = p·q, b = p+q', query: 'How does the AC method work for splitting the middle term in 2x² + x - 528 = 0?' },
  { id: 'QUAD-04', label: '4. Factorization', formula: '(2x+33)(x-16) = 0', query: 'How do we factor 2x² + 33x - 32x - 528 into (2x + 33)(x - 16) = 0?' },
  { id: 'QUAD-05', label: '5. Zero Product', formula: 'x = 16 (x > 0)', query: 'Why do we discard negative roots when finding physical dimensions like breadth?' },
  { id: 'QUAD-06', label: '6. Formula & Discriminant', formula: 'x = (-b ± √D)/2a', query: 'How do we use the quadratic formula and discriminant D = b² - 4ac?' }
]

const AP_ROADMAP_NODES = [
  { id: 'AP-01', label: '1. Patterns', formula: 'a₁, a₂, a₃...', query: 'What is a sequence pattern?' },
  { id: 'AP-03', label: '2. AP Definition', formula: 'aₖ₊₁ = aₖ + d', query: 'What defines an Arithmetic Progression?' },
  { id: 'AP-05', label: '3. Common Diff (d)', formula: 'd = a₂ − a₁', query: 'How do we calculate common difference d?' },
  { id: 'AP-06', label: '4. General Form', formula: 'a, a+d, a+2d...', query: 'What is the general algebraic form of an AP?' },
  { id: 'AP-09', label: '5. nth Term (aₙ)', formula: 'aₙ = a + (n−1)d', query: 'How do we find the nth term of an AP?' },
  { id: 'AP-17', label: '6. Sum (Sₙ)', formula: 'Sₙ = n/2[2a+(n−1)d]', query: 'How do we calculate the sum of first n terms?' }
]

export default function KnowledgeGraphRoadmap({
  chapterId = 'chapter-04-quadratic-equations',
  chapterTitle,
  activeConceptId,
  masteredConceptIds = ['QUAD-01', 'QUAD-02'],
  onSelectConcept,
  onAskHermes
}: KnowledgeGraphRoadmapProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const isAP = chapterId.includes('ap') || chapterId.includes('arithmetic') || chapterId.includes('progress')
  const roadmapNodes = isAP ? AP_ROADMAP_NODES : QUADRATIC_ROADMAP_NODES
  const conceptsList = isAP ? DEFAULT_AP_CONCEPTS : DEFAULT_QUADRATIC_CONCEPTS
  const [currentActiveId, setCurrentActiveId] = useState<string>(
    activeConceptId || (isAP ? 'AP-01' : 'QUAD-02')
  )
  const masteredSet = new Set(masteredConceptIds)
  const resolvedTitle = chapterTitle || (isAP ? 'Chapter 5: Arithmetic Progressions' : 'Chapter 4: Quadratic Equations')

  const handleTabClick = (node: typeof roadmapNodes[0]) => {
    setCurrentActiveId(node.id)
    onSelectConcept?.(node.id)
    if (node.query) {
      onAskHermes?.(node.query)
    }
  }

  return (
    <>
      <div className="bg-white border-b border-black/[0.08] px-4 py-2.5 flex items-center justify-between gap-3 overflow-x-auto select-none shrink-0 shadow-xs font-ui">
        {/* Left: Road & Node Strip */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-forest/50 hidden sm:inline">
            Roadmap:
          </span>

          <div className="flex items-center gap-1.5">
            {roadmapNodes.map((node, idx) => {
              const isMastered = masteredSet.has(node.id)
              const isActive = node.id === currentActiveId

              return (
                <React.Fragment key={node.id}>
                  {idx > 0 && (
                    <div
                      className={`w-3 h-0.5 rounded ${
                        isMastered ? 'bg-emerald-500' : 'bg-black/10'
                      }`}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => handleTabClick(node)}
                    title={`${node.label} (${node.formula}) — Click to focus Hermes`}
                    className={`group px-3 py-1 rounded-xl text-[12px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-forest text-white shadow-sm font-semibold'
                        : isMastered
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-cream text-forest/70 border border-black/[0.06] hover:bg-black/5 hover:text-forest'
                    }`}
                  >
                    {isMastered ? (
                      <span className="text-[10px] font-bold text-emerald-600">✓</span>
                    ) : isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-forest/30" />
                    )}
                    <span>{node.label}</span>
                  </button>
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Right: Full Concept Graph Button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1 rounded-xl text-[12px] font-medium bg-cream hover:bg-black/5 border border-black/10 text-forest flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
        >
          <Network className="w-3.5 h-3.5 text-forest/70" />
          <span>Full Concept Graph</span>
          <span className="text-[10px] bg-forest text-white px-1.5 py-0.2 rounded-full font-bold">
            {conceptsList.length}
          </span>
        </button>
      </div>

      {/* Modal Dialog */}
      <ConceptGraphModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chapterTitle={resolvedTitle}
        concepts={conceptsList}
        masteredConceptIds={masteredConceptIds}
        activeConceptId={currentActiveId}
        onSelectConcept={(cid) => {
          setCurrentActiveId(cid)
          onSelectConcept?.(cid)
          const node = roadmapNodes.find((n) => n.id === cid)
          if (node?.query) onAskHermes?.(node.query)
        }}
      />
    </>
  )
}
