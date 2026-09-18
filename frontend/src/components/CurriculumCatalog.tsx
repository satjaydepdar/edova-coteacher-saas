import { useState, useMemo } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  ChevronRight,
  Check,
  Hash,
  Calculator,
  Shapes,
  Triangle,
  BarChart3,
  Dices,
  Ruler,
  BookOpen,
} from 'lucide-react'
import { CURRICULUM_DATABASE, SimulationItem } from '../data/curriculumData'
import { searchSimulationsIntelligently, ParsedSearchIntent } from '../utils/intelligentSearch'
import PageHeader from './PageHeader'
import SearchToolbar, { filterSelectClass } from './SearchToolbar'
import { useAuthStore } from '../store/authStore'

interface CurriculumCatalogProps {
  onLaunchSimulation: (sim: SimulationItem) => void
  activeSubject?: 'maths' | 'science' | 'social' | 'english'
  onSelectSubject?: (subject: 'maths' | 'science' | 'social' | 'english') => void
  selectedChapterId?: string | null
  onSelectChapterId?: (id: string | null) => void
  selectedSubTopicId?: string | null
  onSelectSubTopicId?: (id: string | null) => void
}

const CHAPTER_STYLES: Record<string, { tint: string; color: string; icon: any }> = {
  'number-systems': { tint: '#EFF6FF', color: '#3B82F6', icon: Hash },
  algebra: { tint: '#FEF3C7', color: '#D97706', icon: Calculator },
  geometry: { tint: '#F0FDF4', color: '#16A34A', icon: Shapes },
  trigonometry: { tint: '#FEF2F2', color: '#DC2626', icon: Triangle },
  'statistics-prob': { tint: '#F5F3FF', color: '#7C3AED', icon: BarChart3 },
  statistics: { tint: '#F5F3FF', color: '#7C3AED', icon: BarChart3 },
  probability: { tint: '#FFF7ED', color: '#EA580C', icon: Dices },
  mensuration: { tint: '#ECFEFF', color: '#0891B2', icon: Ruler },
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Beginner: { bg: '#E6F0E8', text: '#2E5A3A', border: '#EDE8DD' },
  BEGINNER: { bg: '#E6F0E8', text: '#2E5A3A', border: '#EDE8DD' },
  Intermediate: { bg: '#FEF3C7', text: '#92400E', border: '#EDE8DD' },
  INTERMEDIATE: { bg: '#FEF3C7', text: '#92400E', border: '#EDE8DD' },
  Advanced: { bg: '#FEE2E2', text: '#991B1B', border: '#EDE8DD' },
  ADVANCED: { bg: '#FEE2E2', text: '#991B1B', border: '#EDE8DD' },
}

const pluralize = (count: number, singular: string, plural = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : plural}`

export default function CurriculumCatalog({
  onLaunchSimulation,
  activeSubject: controlledSubject = 'maths',
  onSelectSubject,
  selectedChapterId: propChapterId,
  onSelectChapterId,
  selectedSubTopicId: propSubTopicId,
  onSelectSubTopicId,
}: CurriculumCatalogProps) {
  const { user } = useAuthStore()
  const currentSubject = controlledSubject || 'maths'

  const [internalChapterId, setInternalChapterId] = useState<string | null>(null)
  const [internalSubTopicId, setInternalSubTopicId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const selectedChapterId = propChapterId !== undefined ? propChapterId : internalChapterId
  const selectedSubTopicId = propSubTopicId !== undefined ? propSubTopicId : internalSubTopicId

  const subjectData = CURRICULUM_DATABASE[currentSubject] || CURRICULUM_DATABASE.maths

  // Flatten all simulations across current subject / chapters
  const allSubjectSimulations = useMemo(() => {
    const sims: SimulationItem[] = []
    subjectData.chapters.forEach((ch) => {
      ch.subtopics.forEach((st) => {
        st.simulations.forEach((s) => {
          sims.push(s)
        })
      })
    })
    return sims
  }, [subjectData])

  // Simulations for current view (if chapter selected, show that chapter's sims; otherwise all subject sims)
  const currentSimulations = useMemo(() => {
    if (!selectedChapterId) return allSubjectSimulations
    const ch = subjectData.chapters.find((c) => c.id === selectedChapterId)
    if (!ch) return allSubjectSimulations
    const sims: SimulationItem[] = []
    ch.subtopics.forEach((st) => {
      st.simulations.forEach((s) => {
        sims.push(s)
      })
    })
    return sims
  }, [selectedChapterId, subjectData, allSubjectSimulations])

  // Intelligent Multi-Field Search & Intent Parsing using BM25
  const searchResult = useMemo(() => {
    return searchSimulationsIntelligently(currentSimulations, searchQuery, selectedSubTopicId)
  }, [currentSimulations, searchQuery, selectedSubTopicId])

  const rankedSimulations = searchResult.rankedSimulations
  const parsedIntent: ParsedSearchIntent = searchResult.parsedIntent

  const selectedChapter = subjectData.chapters.find((c) => c.id === selectedChapterId)

  const handleSelectChapter = (chapterId: string) => {
    if (onSelectChapterId) {
      onSelectChapterId(chapterId)
    } else {
      setInternalChapterId(chapterId)
    }
    const ch = subjectData.chapters.find((c) => c.id === chapterId)
    const firstSub = ch?.subtopics[0]?.id || null
    if (onSelectSubTopicId) {
      onSelectSubTopicId(firstSub)
    } else {
      setInternalSubTopicId(firstSub)
    }
  }

  const handleResetToLevel1 = () => {
    if (onSelectChapterId) {
      onSelectChapterId(null)
    } else {
      setInternalChapterId(null)
    }
    if (onSelectSubTopicId) {
      onSelectSubTopicId(null)
    } else {
      setInternalSubTopicId(null)
    }
    setSearchQuery('')
  }

  const handleSelectSubTopic = (subTopicId: string | null) => {
    if (onSelectSubTopicId) {
      onSelectSubTopicId(subTopicId)
    } else {
      setInternalSubTopicId(subTopicId)
    }
    setSearchQuery('')
  }

  const removeFilterFromQuery = (keywordToRemove: string) => {
    const regex = new RegExp(`\\b${keywordToRemove}\\b`, 'gi')
    const updated = searchQuery.replace(regex, '').replace(/\s+/g, ' ').trim()
    setSearchQuery(updated)
  }

  return (
    <div className="relative min-h-full w-full bg-[#FBF9F3] text-[#111814] selection:bg-[#DDB56E]/30 antialiased font-sans">
      {/* Subtle dotted background */}
      <div className="pointer-events-none absolute inset-0 dotted-grid opacity-[0.32]" />

      <PageHeader
        eyebrow={
          selectedChapter ? (
            <nav className="flex items-center gap-1.5">
              <span
                onClick={handleResetToLevel1}
                className="hover:text-[#111814] cursor-pointer transition-colors"
              >
                {subjectData.title}
              </span>
              <ChevronRight className="w-3 h-3 text-[#D1D5DB]" />
              <span
                onClick={() => handleSelectSubTopic(null)}
                className="hover:text-[#111814] cursor-pointer transition-colors"
              >
                {selectedChapter.title}
              </span>
              {selectedSubTopicId && (
                <>
                  <ChevronRight className="w-3 h-3 text-[#D1D5DB]" />
                  <span className="font-[600] text-[#111814]">
                    {selectedChapter.subtopics.find((st) => st.id === selectedSubTopicId)?.title}
                  </span>
                </>
              )}
            </nav>
          ) : undefined
        }
        title={selectedChapter ? selectedChapter.title : `${subjectData.title} Curriculum`}
        titlePill={
          <span className="h-6 px-3 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[11px] font-mono grid place-items-center text-[#6B7280]">
            {selectedChapter
              ? `${selectedChapter.subtopics.length} SUB-TOPICS`
              : `${subjectData.chapters.length} CHAPTERS`}
          </span>
        }
        description={selectedChapter ? selectedChapter.desc : subjectData.description}
        actions={
          <>
            {selectedChapterId && (
              <button
                type="button"
                onClick={handleResetToLevel1}
                className="h-8 px-3.5 rounded-[10px] bg-white border border-[#EDE8DD] text-[12px] font-[500] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center gap-1.5 hover:bg-[#FBF9F3] text-[#111814] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>← Back to chapters</span>
              </button>
            )}
            {user?.tenant_name && (
              <span className="text-[13px] font-medium text-[#6B7280] font-[Inter] shrink-0">
                {user.tenant_name}
              </span>
            )}
          </>
        }
      />

      <SearchToolbar>
        <select
          value={currentSubject}
          onChange={(e) => onSelectSubject?.(e.target.value as 'maths' | 'science' | 'social' | 'english')}
          className={filterSelectClass}
        >
          <option value="maths">Mathematics</option>
          <option value="science">Science</option>
          <option value="social">Social Science</option>
          <option value="english">English</option>
        </select>
        <select
          value={selectedChapterId ?? 'ALL'}
          onChange={(e) => {
            if (e.target.value === 'ALL') handleResetToLevel1()
            else handleSelectChapter(e.target.value)
          }}
          className={filterSelectClass}
        >
          <option value="ALL">All Chapters</option>
          {subjectData.chapters.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <select
          value={selectedSubTopicId ?? 'ALL'}
          onChange={(e) => handleSelectSubTopic(e.target.value === 'ALL' ? null : e.target.value)}
          disabled={!selectedChapterId}
          className={`${filterSelectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="ALL">All Topics</option>
          {(selectedChapter?.subtopics ?? []).map((st) => (
            <option key={st.id} value={st.id}>{st.title}</option>
          ))}
        </select>
      </SearchToolbar>

      <div className="relative z-10 px-8 pt-6 pb-8 space-y-6">
        {/* LEVEL 1: CHAPTERS 3-COLUMN GRID VIEW (When no chapter is selected) */}
        {!selectedChapterId ? (
          <section className="animate-fadeIn">
            <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
              {subjectData.chapters.map((ch) => {
                const style = CHAPTER_STYLES[ch.id] || { tint: '#EFF6FF', color: '#3B82F6', icon: BookOpen }
                const IconComponent = style.icon

                return (
                  <div
                    key={ch.id}
                    onClick={() => handleSelectChapter(ch.id)}
                    className="group rounded-[16px] bg-white border border-[#EDE8DD] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] p-6 transition-all hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.06)] cursor-pointer flex flex-col justify-between min-h-[180px]"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div
                          className="w-8 h-8 rounded-[10px] grid place-items-center"
                          style={{ background: style.tint }}
                        >
                          <IconComponent className="w-4 h-4" style={{ color: style.color }} />
                        </div>
                        <span className="h-6 px-2.5 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[10px] font-mono tracking-[0.06em] grid place-items-center text-[#6B7280]">
                          {pluralize(ch.subtopics.length, 'sub-topic')}
                        </span>
                      </div>

                      <div className="mt-4 font-news text-[16px] font-[600] tracking-[-0.01em] text-[#111814]">
                        {ch.title}
                      </div>

                      <div className="mt-1.5 text-[12px] leading-[1.5] text-[#6B7280] line-clamp-2">
                        {ch.desc}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F3F0E8]">
                      <div className="flex items-center text-[12px] text-[#6B7280] font-[500] group-hover:text-[#111814] transition-colors">
                        <span>Explore sub-topics & simulations</span>
                        <ArrowRight className="ml-1.5 w-3.5 h-3.5 transition-transform group-hover:translate-x-[2px]" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ) : (
          /* LEVEL 2 & 3: SUB-TOPICS & INTELLIGENT SEARCH CATALOG */
          <section className="space-y-4 animate-fadeIn">
            {/* Level 2: Sub-Topics Filter Bar */}
            {selectedChapter && selectedChapter.subtopics.length > 0 && (
              <div className="rounded-[16px] bg-white border border-[#EDE8DD] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-mono tracking-[0.12em] text-[#9CA3AF] mr-1 uppercase">
                  SUB-TOPICS IN {selectedChapter.title.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectSubTopic(null)}
                  className={`h-7 px-3 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                    !selectedSubTopicId
                      ? 'bg-[#1A221E] text-white shadow-xs'
                      : 'bg-[#F6F1E6] border border-[#EDE8DD] text-[#6B7280] hover:bg-white'
                  }`}
                >
                  All ({selectedChapter.subtopics.reduce((acc, st) => acc + st.simCount, 0)})
                </button>
                {selectedChapter.subtopics.map((st) => {
                  const isSelected = st.id === selectedSubTopicId
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleSelectSubTopic(st.id)}
                      className={`h-7 px-3 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#1A221E] text-white shadow-xs'
                          : 'bg-[#F6F1E6] border border-[#EDE8DD] text-[#6B7280] hover:bg-white'
                      }`}
                    >
                      {st.title} ({st.simCount})
                    </button>
                  )
                })}
              </div>
            )}

            {/* Level 3: Unified Intelligent BM25 Natural Language Search Bar */}
            <div className="rounded-[16px] bg-white border border-[#EDE8DD] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-3 flex items-center gap-3 max-md:flex-wrap">
              <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-[10px] bg-[#FBF9F3] border border-[#EDE8DD] min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  type="text"
                  placeholder="Intelligent BM25 search... (type any keyword or difficulty, e.g. 'park', 'rocket', 'beginner', 'area', 'advanced', '528')"
                  className="flex-1 bg-transparent outline-none text-[12px] placeholder:text-[#9CA3AF] text-[#111814]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[11px] font-mono text-[#9CA3AF] hover:text-[#111814] px-1.5 cursor-pointer"
                  >
                    Clear ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="h-7 px-2.5 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[10px] font-mono flex items-center gap-1 text-[#92400E]">
                  <Sparkles className="w-3 h-3 text-[#D97706]" />
                  <span>BM25 ACTIVE</span>
                </span>

                <span className="text-[11px] font-mono text-[#6B7280]">
                  {rankedSimulations.length} SIMULATION{rankedSimulations.length === 1 ? '' : 'S'} FOUND
                </span>

                <div className="ml-2 flex items-center p-1 rounded-full bg-[#FBF9F3] border border-[#EDE8DD]">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`w-7 h-7 grid place-items-center rounded-full transition-colors cursor-pointer ${
                      viewMode === 'grid' ? 'bg-[#1A221E] text-white' : 'text-[#9CA3AF] hover:text-[#111814]'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`w-7 h-7 grid place-items-center rounded-full transition-colors cursor-pointer ${
                      viewMode === 'list' ? 'bg-[#1A221E] text-white' : 'text-[#9CA3AF] hover:text-[#111814]'
                    }`}
                    title="List View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Search Feedback Chips */}
            {searchQuery.trim() && (
              <div className="flex flex-wrap items-center gap-2 px-2 text-[12px]">
                <span className="text-[#6B7280] font-medium text-[11px] flex items-center gap-1 font-mono">
                  <Sparkles className="w-3 h-3 text-[#D97706]" /> Detected:
                </span>

                {parsedIntent.detectedDifficulty && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                    <span>Level: {parsedIntent.detectedDifficulty}</span>
                    <button
                      type="button"
                      onClick={() => removeFilterFromQuery(parsedIntent.detectedDifficulty || '')}
                      className="hover:opacity-100 opacity-60 cursor-pointer text-[10px]"
                      title="Remove difficulty filter"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {parsedIntent.detectedTopic && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#F6F1E6] text-[#111814] border border-[#EDE8DD]">
                    <span>Topic: {parsedIntent.detectedTopic}</span>
                  </span>
                )}
              </div>
            )}

            {/* Simulation Cards Grid / List */}
            {rankedSimulations.length === 0 ? (
              <div className="w-full py-16 text-center text-[#6B7280] text-[13px] font-medium bg-white border border-[#EDE8DD] rounded-[16px] shadow-card">
                No simulations found matching "{searchQuery}". Try terms like "park", "rocket", "beginner", "linear", or "area".
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
                {rankedSimulations.map((item) => {
                  const levelStyle = LEVEL_STYLES[item.difficulty] || LEVEL_STYLES.Beginner
                  const isSolved = item.status === 'Solved ✓'

                  return (
                    <div
                      key={item.id}
                      className="group rounded-[16px] bg-white border border-[#EDE8DD] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] p-5 flex flex-col hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.06)] transition-all min-h-[200px]"
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className="h-5 px-2 rounded-full text-[10px] font-mono tracking-[0.08em] font-semibold border"
                          style={{
                            background: levelStyle.bg,
                            color: levelStyle.text,
                            borderColor: levelStyle.border,
                          }}
                        >
                          {item.difficulty.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono text-[#9CA3AF]">
                          {item.time} • {item.points} XP
                        </span>
                      </div>

                      <div className="mt-3 font-news text-[14px] font-[600] leading-[1.3] text-[#111814]">
                        {item.title}
                      </div>

                      <div className="mt-1.5 text-[12px] leading-[1.5] text-[#6B7280] line-clamp-2">
                        {item.desc}
                      </div>

                      {item.equation && (
                        <div className="mt-3 inline-flex h-6 px-2.5 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[11px] font-mono text-[#6B7280] self-start">
                          {item.equation}
                        </div>
                      )}

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#F3F0E8]">
                        <span
                          className={`text-[11px] font-mono flex items-center gap-1 ${
                            isSolved ? 'text-[#16A34A]' : 'text-[#9CA3AF]'
                          }`}
                        >
                          {isSolved && <Check className="w-3 h-3 text-[#16A34A]" />}
                          <span>{item.hasSimulation ? item.status || 'Ready' : 'In development'}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => onLaunchSimulation(item)}
                          className="h-8 px-3.5 rounded-[10px] bg-[#1A221E] text-white text-[12px] font-[500] flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.12)] group-hover:bg-black transition-colors cursor-pointer"
                        >
                          <span>{item.hasSimulation ? 'Launch' : 'Inspect'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* List View */
              <div className="space-y-3">
                {rankedSimulations.map((item) => {
                  const levelStyle = LEVEL_STYLES[item.difficulty] || LEVEL_STYLES.Beginner
                  const isSolved = item.status === 'Solved ✓'

                  return (
                    <div
                      key={item.id}
                      className="group rounded-[16px] bg-white border border-[#EDE8DD] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-5 px-2 rounded-full text-[10px] font-mono tracking-[0.08em] font-semibold border"
                            style={{
                              background: levelStyle.bg,
                              color: levelStyle.text,
                              borderColor: levelStyle.border,
                            }}
                          >
                            {item.difficulty.toUpperCase()}
                          </span>
                          <div className="font-news text-[15px] font-[600] text-[#111814]">
                            {item.title}
                          </div>
                        </div>
                        <p className="text-[12px] text-[#6B7280] line-clamp-1 leading-[1.5]">
                          {item.desc}
                        </p>
                      </div>

                      {item.equation && (
                        <div className="h-7 px-3 rounded-full bg-[#F6F1E6] border border-[#EDE8DD] text-[11px] font-mono text-[#6B7280] flex items-center shrink-0">
                          {item.equation}
                        </div>
                      )}

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[11px] font-mono text-[#9CA3AF]">
                          {item.time} • {item.points} XP
                        </span>
                        <button
                          type="button"
                          onClick={() => onLaunchSimulation(item)}
                          className="h-8 px-3.5 rounded-[10px] bg-[#1A221E] text-white text-[12px] font-[500] flex items-center gap-1.5 shadow-xs hover:bg-black transition-colors cursor-pointer"
                        >
                          <span>{item.hasSimulation ? 'Launch' : 'Inspect'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
