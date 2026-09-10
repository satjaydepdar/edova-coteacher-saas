import { useState, useMemo } from 'react'
import { ArrowLeft, Search, Grid, List, Sparkles, ChevronRight, ExternalLink } from 'lucide-react'
import { CURRICULUM_DATABASE, SimulationItem } from '../data/curriculumData'
import { searchSimulationsIntelligently, ParsedSearchIntent } from '../utils/intelligentSearch'

/**
 * Design System Typography Scale (Linear / Stripe / Notion / Apple HIG Standards)
 *
 * | Token           | Font Size       | Weight    | Line Height | Tracking | Text Color | Contrast against BG |
 * |-----------------|-----------------|-----------|-------------|----------|------------|---------------------|
 * | Display H1      | 30px (1.875rem) | Bold 700  | 1.2 (36px)  | -0.02em  | #111827    | 14.15:1 (AAA)       |
 * | Section H2      | 20px (1.25rem)  | Bold 700  | 1.3 (26px)  | -0.015em | #111827    | 14.15:1 (AAA)       |
 * | Card Title (H3) | 17px (1.0625rem)| Bold 700  | 1.35 (23px) | -0.01em  | #111827    | 18.06:1 on white    |
 * | Subtitle/Intro  | 14px (0.875rem) | Reg 400   | 1.6 (22px)  | normal   | #374151    | 8.35:1 (AAA)        |
 * | Card Body Copy  | 14px (0.875rem) | Reg 400   | 1.6 (22px)  | normal   | #4B5563    | 7.10:1 on white(AAA)|
 * | Breadcrumb/Meta | 13px (0.8125rem)| Med 500   | 1.4 (18px)  | normal   | #4B5563    | 5.58:1 on cream     |
 * | Card CTA Link   | 13px (0.8125rem)| Med 500   | 1.4 (18px)  | normal   | #4B5563    | Hover #111827       |
 * | Pill / Badge    | 12px (0.75rem)  | Med 500   | 1.0 (12px)  | 0.01em   | #374151    | 8.35:1 on cream     |
 */

interface CurriculumCatalogProps {
  onLaunchSimulation: (sim: SimulationItem) => void
  activeSubject?: 'maths' | 'science' | 'social' | 'english'
}

const DIFF_CLS: Record<string, string> = {
  Beginner: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  Intermediate: 'bg-amber-50 border-amber-200 text-amber-800',
  Advanced: 'bg-red-50 border-red-200 text-red-800',
}

// Grammar & Pluralization Helper
const pluralize = (count: number, singular: string, plural = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : plural}`

export default function CurriculumCatalog({
  onLaunchSimulation,
  activeSubject: controlledSubject = 'maths',
}: CurriculumCatalogProps) {
  const currentSubject = controlledSubject || 'maths'

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [selectedSubTopicId, setSelectedSubTopicId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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

  // Intelligent Multi-Field Search & Intent Parsing using BM25
  const searchResult = useMemo(() => {
    return searchSimulationsIntelligently(allSubjectSimulations, searchQuery, selectedSubTopicId)
  }, [allSubjectSimulations, searchQuery, selectedSubTopicId])

  const rankedSimulations = searchResult.rankedSimulations
  const parsedIntent: ParsedSearchIntent = searchResult.parsedIntent

  const selectedChapter = subjectData.chapters.find((c) => c.id === selectedChapterId)

  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId)
    const ch = subjectData.chapters.find((c) => c.id === chapterId)
    setSelectedSubTopicId(ch?.subtopics[0]?.id || null)
  }

  const handleResetToLevel1 = () => {
    setSelectedChapterId(null)
    setSelectedSubTopicId(null)
    setSearchQuery('')
  }

  const removeFilterFromQuery = (keywordToRemove: string) => {
    const regex = new RegExp(`\\b${keywordToRemove}\\b`, 'gi')
    const updated = searchQuery.replace(regex, '').replace(/\s+/g, ' ').trim()
    setSearchQuery(updated)
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1440px] mx-auto w-full font-ui text-[#111827]">
      {/* Top Header & Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          {/* Breadcrumb metadata */}
          <nav className="flex items-center gap-2 text-[13px] font-medium text-[#4B5563] mb-2.5">
            <span
              onClick={handleResetToLevel1}
              className="hover:text-[#111827] cursor-pointer transition-colors"
            >
              {subjectData.title}
            </span>
            {selectedChapter && (
              <>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                <span
                  onClick={() => setSelectedSubTopicId(null)}
                  className="hover:text-[#111827] cursor-pointer transition-colors"
                >
                  {selectedChapter.title}
                </span>
              </>
            )}
            {selectedSubTopicId && (
              <>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                <span className="text-[#111827] font-semibold">
                  {selectedChapter?.subtopics.find((st) => st.id === selectedSubTopicId)?.title}
                </span>
              </>
            )}
          </nav>

          {/* H1 Heading with Precise Cap-Height Aligned Gold Accent Bar & Negative Tracking */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="w-1.5 h-[22px] rounded-full bg-gold shrink-0 self-center"
              aria-hidden="true"
            />
            <h1 className="font-display text-[26px] md:text-[30px] font-bold tracking-[-0.02em] text-[#111827] leading-tight">
              {selectedChapter ? selectedChapter.title : `${subjectData.title} Curriculum`}
            </h1>
            <span className="ml-1 text-[12px] font-medium text-[#374151] bg-white border border-black/10 px-3 py-0.5 rounded-full shadow-xs">
              {selectedChapter
                ? pluralize(selectedChapter.subtopics.length, 'sub-topic')
                : pluralize(subjectData.chapters.length, 'chapter')}
            </span>
          </div>

          <p className="text-[14px] font-normal text-[#374151] mt-2.5 leading-[1.6] max-w-3xl">
            {selectedChapter ? selectedChapter.desc : subjectData.description}
          </p>
        </div>

        {selectedChapterId && (
          <button
            onClick={handleResetToLevel1}
            className="h-10 px-5 rounded-full bg-white border border-black/10 text-[13px] font-medium text-[#111827] flex items-center gap-2 hover:bg-black/5 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to chapters
          </button>
        )}
      </div>

      {/* LEVEL 1: CHAPTERS GRID VIEW (When no chapter is selected) */}
      {!selectedChapterId ? (
        <section className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {subjectData.chapters.map((ch) => (
              <div
                key={ch.id}
                onClick={() => handleSelectChapter(ch.id)}
                className="bg-white rounded-[20px] border border-black/[0.06] p-7 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 group flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-3xl">{ch.icon}</span>
                    <span className="text-[12px] font-medium text-[#374151] bg-cream border border-black/[0.08] px-3 py-1 rounded-full">
                      {pluralize(ch.subtopics.length, 'sub-topic')}
                    </span>
                  </div>

                  {/* Card Title: High contrast bold (700), #111827 */}
                  <h3 className="font-display text-[17px] font-bold text-[#111827] tracking-[-0.01em] leading-snug group-hover:text-[#111827] transition-colors mb-2.5">
                    {ch.title}
                  </h3>

                  {/* Card Body: font-weight 400, cooler gray #4B5563 (WCAG AA 7.1:1 contrast) */}
                  <p className="text-[14px] font-normal text-[#4B5563] leading-[1.6] line-clamp-2">
                    {ch.desc}
                  </p>
                </div>

                {/* Card CTA: Sentence case, font-weight 500 */}
                <div className="mt-8 pt-5 border-t border-black/[0.06] flex items-center justify-between text-[13px] font-medium text-[#4B5563] group-hover:text-[#111827] transition-colors">
                  <span>Explore sub-topics & simulations</span>
                  <span className="text-[15px] transition-transform group-hover:translate-x-1 font-bold">→</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        /* LEVEL 2 & 3: SUB-TOPICS & INTELLIGENT SEARCH CATALOG */
        <section className="space-y-8">
          {/* Level 2 Sub-Topics Selector */}
          {selectedChapter && selectedChapter.subtopics.length > 1 && (
            <div className="bg-white rounded-[20px] border border-black/[0.06] p-6 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] uppercase font-bold tracking-wider text-[#4B5563]">
                  Sub-topics in {selectedChapter.title}
                </span>
                <span className="text-[12px] font-medium text-[#4B5563]">
                  {pluralize(selectedChapter.subtopics.length, 'sub-topic')} available
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {selectedChapter.subtopics.map((st) => {
                  const isSelected = st.id === selectedSubTopicId
                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        setSelectedSubTopicId(st.id)
                        setSearchQuery('')
                      }}
                      className={`px-4 py-2 rounded-xl text-[13px] transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-forest text-white font-semibold shadow-sm'
                          : 'bg-cream hover:bg-cream-border text-[#374151] border border-black/[0.06] font-medium'
                      }`}
                    >
                      {st.title} ({st.simCount})
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Level 3: Unified Intelligent BM25 Natural Language Search Bar */}
          <div className="bg-white rounded-[20px] border border-black/[0.06] p-5 shadow-card flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Intelligent Search Input */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  type="text"
                  placeholder="Intelligent BM25 search... (type any keyword or difficulty, e.g. 'park', 'rocket', 'beginner', 'area', 'advanced', '528')"
                  className="w-full bg-cream border border-black/[0.08] rounded-xl pl-11 pr-24 py-3 text-[13px] font-normal text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:border-gold transition-colors font-ui shadow-inner"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[#4B5563] hover:text-[#111827] bg-white border border-black/10 px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    Clear ✕
                  </button>
                ) : (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-[#4B5563] bg-white border border-black/[0.06] px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium shadow-xs">
                    <Sparkles className="w-3 h-3 text-gold" /> BM25 active
                  </span>
                )}
              </div>

              {/* View Switcher & Simulation Count with Pluralization */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[12px] text-[#4B5563] font-medium">
                  {pluralize(searchResult.totalMatches, 'simulation')} found
                </span>

                <div className="flex items-center gap-1 bg-cream p-1 rounded-xl border border-black/10">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'grid'
                        ? 'bg-forest text-white shadow-sm'
                        : 'text-[#4B5563] hover:text-[#111827]'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" /> Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'list'
                        ? 'bg-forest text-white shadow-sm'
                        : 'text-[#4B5563] hover:text-[#111827]'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" /> List
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Search Feedback Chips */}
            {searchQuery.trim() && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-black/[0.06] text-[12px]">
                <span className="text-[#4B5563] font-medium text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-gold" /> Detected:
                </span>

                {parsedIntent.detectedDifficulty && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold border ${
                      DIFF_CLS[parsedIntent.detectedDifficulty] || 'bg-cream text-[#111827]'
                    }`}
                  >
                    <span>Level: {parsedIntent.detectedDifficulty}</span>
                    <button
                      onClick={() => removeFilterFromQuery(parsedIntent.detectedDifficulty || '')}
                      className="hover:opacity-100 opacity-60 cursor-pointer text-[10px]"
                      title="Remove difficulty filter"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {parsedIntent.detectedTopic && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-forest/5 text-[#111827] border border-forest/15">
                    <span>Topic: {parsedIntent.detectedTopic}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Simulation Items Grid / List */}
          {rankedSimulations.length === 0 ? (
            <div className="w-full py-16 text-center text-[#4B5563] text-[14px] font-normal bg-white border border-black/[0.06] rounded-[20px] shadow-card">
              No simulations found matching "{searchQuery}". Try terms like "park", "rocket", "beginner", "linear", or "area".
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {rankedSimulations.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-[20px] border border-black/[0.06] p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-semibold uppercase px-3 py-0.5 rounded-full border ${
                          DIFF_CLS[item.difficulty] || 'bg-cream text-[#111827]'
                        }`}
                      >
                        {item.difficulty}
                      </span>
                      <div className="flex items-center gap-2 text-[12px] font-medium text-[#4B5563]">
                        <span>⏱️ {item.time}</span>
                        <span>•</span>
                        <span>✦ {item.points} XP</span>
                      </div>
                    </div>

                    {/* Card Title (H3): font-weight 700, color #111827 */}
                    <h3 className="font-display text-[17px] font-bold text-[#111827] tracking-[-0.01em] leading-snug group-hover:text-[#111827] transition-colors">
                      {item.title}
                    </h3>

                    {/* Card Description: font-weight 400, color #4B5563 (WCAG AA 7.1:1 contrast) */}
                    <p className="text-[14px] font-normal text-[#4B5563] leading-[1.6] line-clamp-2">
                      {item.desc}
                    </p>

                    {item.equation && (
                      <div className="bg-cream border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-[12px] font-mono font-bold text-[#111827]">
                        {item.equation}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-black/[0.06]">
                    <span className="text-[12px] font-medium text-[#4B5563]">
                      {item.hasSimulation ? item.status || 'Ready' : 'In development'}
                    </span>
                    <button
                      onClick={() => onLaunchSimulation(item)}
                      className={`h-9 px-4 rounded-xl font-medium text-[12px] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                        item.hasSimulation
                          ? 'bg-forest hover:bg-forest-raised text-white'
                          : 'bg-cream text-[#4B5563] hover:bg-black/5 border border-black/[0.06]'
                      }`}
                    >
                      <span>{item.hasSimulation ? 'Launch' : 'Inspect'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {rankedSimulations.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-[18px] border border-black/[0.06] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card hover:shadow-card-hover transition-all"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                          DIFF_CLS[item.difficulty] || 'bg-cream text-[#111827]'
                        }`}
                      >
                        {item.difficulty}
                      </span>
                      <h3 className="font-display text-[16px] font-bold text-[#111827] tracking-[-0.01em]">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-[14px] font-normal text-[#4B5563] leading-[1.6] line-clamp-1">
                      {item.desc}
                    </p>
                  </div>

                  {item.equation && (
                    <div className="bg-cream border border-black/[0.06] px-3.5 py-2 rounded-xl text-[12px] font-mono font-bold text-[#111827] shrink-0">
                      {item.equation}
                    </div>
                  )}

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-[12px] font-medium text-[#4B5563]">⏱️ {item.time}</span>
                    <button
                      onClick={() => onLaunchSimulation(item)}
                      className={`h-9 px-4 rounded-xl font-medium text-[12px] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                        item.hasSimulation
                          ? 'bg-forest hover:bg-forest-raised text-white'
                          : 'bg-cream text-[#4B5563] hover:bg-black/5 border border-black/[0.06]'
                      }`}
                    >
                      <span>{item.hasSimulation ? 'Launch' : 'Inspect'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
