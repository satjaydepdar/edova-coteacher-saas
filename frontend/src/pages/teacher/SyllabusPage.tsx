import React, { useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronRight,
  Clock,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import SearchToolbar, { filterSelectClass } from '../../components/SearchToolbar'
import { useSyllabusStore } from '../../store/syllabusStore'

export default function SyllabusPage() {
  const {
    units,
    completedTopicIds,
    fetchPacing,
    toggleTopic,
    getUnitProgress,
    getOverallProgress,
  } = useSyllabusStore()

  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({
    'unit-1': true,
    'unit-2': true,
  })
  const [chapterFilter, setChapterFilter] = useState('ALL')

  useEffect(() => {
    fetchPacing()
  }, [fetchPacing])

  const toggleExpand = (unitId: string) => {
    setExpandedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }))
  }

  const chapterOptions = useMemo(
    () =>
      units
        .flatMap((u) => u.chapters.map((ch) => ({ id: ch.id, unitId: u.id, label: `${ch.number}. ${ch.title}` })))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    [units]
  )

  const handleChapterFilterChange = (chapterId: string) => {
    setChapterFilter(chapterId)
    if (chapterId !== 'ALL') {
      const match = chapterOptions.find((c) => c.id === chapterId)
      if (match) setExpandedUnits((prev) => ({ ...prev, [match.unitId]: true }))
    }
  }

  const visibleUnits = useMemo(() => {
    if (chapterFilter === 'ALL') return units
    return units
      .map((u) => ({ ...u, chapters: u.chapters.filter((ch) => ch.id === chapterFilter) }))
      .filter((u) => u.chapters.length > 0)
  }, [units, chapterFilter])

  const overallProgress = getOverallProgress()

  let totalTopics = 0
  let totalChapters = 0
  let completedTopicsCount = 0
  units.forEach((u) => {
    u.chapters.forEach((ch) => {
      totalChapters += 1
      ch.topics.forEach((t) => {
        totalTopics += 1
        if (completedTopicIds[t.id]) completedTopicsCount += 1
      })
    })
  })

  return (
    <div className="min-h-full bg-[#FBF9F3] text-[#11181C] font-[Inter]">
      <PageHeader
        title="Syllabus & Pacing Map"
        description="CBSE Class 10 Mathematics curriculum alignment, weightage, and topic pacing."
      />

      <SearchToolbar>
        <select className={filterSelectClass} value="10" disabled>
          <option value="10">Class 10</option>
        </select>
        <select className={filterSelectClass} value="mathematics" disabled>
          <option value="mathematics">Mathematics</option>
        </select>
        <select
          className={filterSelectClass}
          value={chapterFilter}
          onChange={(e) => handleChapterFilterChange(e.target.value)}
        >
          <option value="ALL">All Chapters</option>
          {chapterOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <div className="hidden lg:flex items-center gap-2 ml-auto text-[11px] font-mono text-[#8A8F98] shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#4A7C59]" /> In progress
          <span className="w-2 h-2 rounded-full bg-[#E5E7EB] ml-2" /> Not started
        </div>
      </SearchToolbar>

      <div className="px-8 pb-8 space-y-4">
        {/* Progress & Weightage Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl space-y-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#8A8F98]">
              Overall Pacing
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-[20px] font-bold font-mono tracking-[-0.02em] text-[#11181C]">
                {overallProgress}%
              </span>
              <span className="text-xs font-medium text-[#6B7280]">
                {completedTopicsCount} of {totalTopics} topics
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4A7C59] rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl space-y-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#8A8F98]">
              Board Assessment
            </span>
            <div className="text-[20px] font-bold font-mono tracking-[-0.02em] text-[#C8A86A]">
              80 Marks
            </div>
            <p className="text-xs text-[#8A8F98]">CBSE Annual Theory Examination</p>
          </div>

          <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl space-y-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#8A8F98]">
              Internal Assessment
            </span>
            <div className="text-[20px] font-bold font-mono tracking-[-0.02em] text-[#11181C]">
              20 Marks
            </div>
            <p className="text-xs text-[#8A8F98]">Lab activities, quizzes & homework</p>
          </div>

          <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl space-y-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#8A8F98]">
              Curriculum Structure
            </span>
            <div className="text-[16px] font-bold tracking-[-0.01em] text-[#11181C]">
              {units.length} Units · {totalChapters} Chapters
            </div>
            <p className="text-xs text-[#8A8F98]">100% NEP 2020 Aligned</p>
          </div>
        </div>

        {/* Units & Chapters Tree */}
        <div className="space-y-3">
        {visibleUnits.length === 0 ? (
          <div className="py-16 text-center bg-white border border-dashed border-[#E5E7EB] rounded-2xl">
            <p className="text-sm text-[#6B7280]">No chapter matches this filter.</p>
          </div>
        ) : visibleUnits.map((unit) => {
          const isExpanded = !!expandedUnits[unit.id]
          const unitProgress = getUnitProgress(unit.id)

          return (
            <div
              key={unit.id}
              className={`rounded-xl border overflow-hidden transition-all ${
                isExpanded ? 'bg-[#FFFEF8] border-[#E8DCC0]' : 'bg-white border-[#E5E7EB]'
              }`}
            >
              {/* Unit Header */}
              <div
                onClick={() => toggleExpand(unit.id)}
                className="h-12 px-4 flex items-center justify-between cursor-pointer select-none hover:bg-black/[0.01] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button className="text-[#9AA0A8] hover:text-[#11181C] shrink-0">
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>
                  <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#8A8F98] shrink-0">
                    {unit.unitNumber}
                  </span>
                  <h3 className="font-semibold text-[13px] lg:text-[14px] tracking-[-0.01em] text-[#11181C] truncate">
                    {unit.title}
                  </h3>
                  <span className="hidden sm:inline-flex h-5 px-2 items-center rounded-full bg-[#F8F1E2] border border-[#EADFBE] text-[10px] font-mono font-medium text-[#B8934A] shrink-0">
                    {unit.marks} Marks
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#6B7280]">
                      {unitProgress}%
                    </span>
                    <div className="w-20 h-1.5 bg-[#F0E8D0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4A7C59] rounded-full transition-all duration-300"
                        style={{ width: `${unitProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chapters & Topics (Expanded) */}
              {isExpanded && (
                <div className="border-t border-[#F0E8D0] px-4 lg:px-5 py-4 space-y-5">
                  {unit.chapters.map((chapter) => (
                    <div key={chapter.id} className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#11181C] text-white text-[11px] font-mono font-medium flex items-center justify-center shrink-0">
                          {chapter.number}
                        </span>
                        <h4 className="text-[12px] font-semibold tracking-[-0.01em] text-[#11181C]">
                          {chapter.title}
                        </h4>
                        <span className="ml-auto text-[10px] font-mono px-2 h-5 rounded-full bg-white border border-[#E5E7EB] text-[#8A8F98] flex items-center shrink-0">
                          {chapter.topics.length} topics
                        </span>
                      </div>

                      {/* Topics List with Interactive Checkbox */}
                      <div className="ml-[7px] border-l border-[#F0E8D0] pl-6 grid grid-cols-1 md:grid-cols-2 gap-x-4">
                        {chapter.topics.map((topic) => {
                          const isDone = !!completedTopicIds[topic.id]
                          return (
                            <div
                              key={topic.id}
                              onClick={() => toggleTopic(topic.id)}
                              className={`group flex items-center gap-3 py-1.5 cursor-pointer ${
                                isDone ? 'bg-[#E8F5E9] rounded-lg px-2 -mx-2' : ''
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                                  isDone ? 'bg-[#4A7C59] border-[#4A7C59]' : 'bg-white border-[#D1D5DB]'
                                }`}
                              >
                                {isDone && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span
                                className={`flex-1 min-w-0 text-[12px] leading-[1.4] truncate ${
                                  isDone ? 'text-[#11181C]/60 line-through' : 'text-[#2A2F36] group-hover:text-[#11181C]'
                                }`}
                              >
                                {topic.title}
                              </span>
                              <span className="text-[10px] font-mono h-5 px-2 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] text-[#6B7280] flex items-center gap-1 shrink-0">
                                <Clock className="w-3 h-3" />
                                {topic.periods}p
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}
