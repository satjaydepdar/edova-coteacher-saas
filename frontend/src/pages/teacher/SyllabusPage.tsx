import React, { useEffect, useState } from 'react'
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
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

  useEffect(() => {
    fetchPacing()
  }, [fetchPacing])

  const toggleExpand = (unitId: string) => {
    setExpandedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }))
  }

  const overallProgress = getOverallProgress()

  let totalTopics = 0
  let completedTopicsCount = 0
  units.forEach((u) => {
    u.chapters.forEach((ch) => {
      ch.topics.forEach((t) => {
        totalTopics += 1
        if (completedTopicIds[t.id]) completedTopicsCount += 1
      })
    })
  })

  return (
    <div className="min-h-screen bg-[#FBF7EE] text-[#13231F] font-[Inter] p-6 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#13231F] flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-[#7FBF7A]" />
            Syllabus & Pacing Map
          </h1>
          <p className="text-[14px] text-black/60 mt-1">
            CBSE Class 10 Mathematics curriculum alignment, weightage, and topic pacing.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 bg-[#FCFBF8] border border-[#E8E0CC] rounded-xl font-semibold text-[#13231F] shadow-xs">
            Academic Year: 2026-2027
          </span>
          <span className="px-3 py-1.5 bg-[#FCFBF8] border border-[#E8E0CC] rounded-xl font-semibold text-[#13231F] shadow-xs">
            CBSE Class 10 · Mathematics
          </span>
        </div>
      </div>

      {/* Progress & Weightage Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FCFBF8] border border-[#E8E0CC] p-4 rounded-2xl shadow-xs space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-black/50">
            Overall Pacing
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#13231F]">
              {overallProgress}%
            </span>
            <span className="text-xs font-medium text-black/60">
              {completedTopicsCount} of {totalTopics} topics
            </span>
          </div>
          <div className="w-full h-2 bg-[#E8E0CC] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#7FBF7A] rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-[#FCFBF8] border border-[#E8E0CC] p-4 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-black/50">
            Board Assessment
          </span>
          <div className="text-2xl font-bold font-mono text-[#D9A94E]">
            80 Marks
          </div>
          <p className="text-xs text-black/60">CBSE Annual Theory Examination</p>
        </div>

        <div className="bg-[#FCFBF8] border border-[#E8E0CC] p-4 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-black/50">
            Internal Assessment
          </span>
          <div className="text-2xl font-bold font-mono text-[#13231F]">
            20 Marks
          </div>
          <p className="text-xs text-black/60">Lab activities, quizzes & homework</p>
        </div>

        <div className="bg-[#FCFBF8] border border-[#E8E0CC] p-4 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-black/50">
            Curriculum Structure
          </span>
          <div className="text-2xl font-bold font-mono text-[#13231F]">
            7 Units · 14 Chapters
          </div>
          <p className="text-xs text-black/60">100% NEP 2020 Aligned</p>
        </div>
      </div>

      {/* Units & Chapters Tree */}
      <div className="space-y-4">
        {units.map((unit) => {
          const isExpanded = !!expandedUnits[unit.id]
          const unitProgress = getUnitProgress(unit.id)

          return (
            <div
              key={unit.id}
              className="bg-[#FCFBF8] border border-[#E8E0CC] rounded-2xl shadow-xs overflow-hidden transition-all"
            >
              {/* Unit Header */}
              <div
                onClick={() => toggleExpand(unit.id)}
                className="p-5 flex items-center justify-between cursor-pointer select-none hover:bg-[#F5F1E6]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button className="text-black/40 hover:text-[#13231F]">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-[#7FBF7A]" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-black/40" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-black/50 bg-[#F5F1E6] px-2 py-0.5 rounded">
                        {unit.unitNumber}
                      </span>
                      <h3 className="font-bold text-base lg:text-lg text-[#13231F]">
                        {unit.title}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-[#D9A94E]/15 text-[#8A6A2E] border border-[#D9A94E]/30 rounded-lg">
                        {unit.marks} Marks
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-xs font-mono text-black/60 font-semibold">
                      {unitProgress}%
                    </span>
                    <div className="w-24 h-2 bg-[#E8E0CC] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#7FBF7A] rounded-full transition-all duration-300"
                        style={{ width: `${unitProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chapters & Topics (Expanded) */}
              {isExpanded && (
                <div className="border-t border-[#E8E0CC] bg-[#FDFCF9] divide-y divide-[#E8E0CC]/70">
                  {unit.chapters.map((chapter) => (
                    <div key={chapter.id} className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-[14.5px] text-[#13231F] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-forest text-white text-xs flex items-center justify-center font-mono">
                            {chapter.number}
                          </span>
                          <span>{chapter.title}</span>
                        </h4>
                        <span className="text-xs text-black/50 font-medium">
                          {chapter.topics.length} topics
                        </span>
                      </div>

                      {/* Topics List with Interactive Checkbox */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-8">
                        {chapter.topics.map((topic) => {
                          const isDone = !!completedTopicIds[topic.id]
                          return (
                            <div
                              key={topic.id}
                              onClick={() => toggleTopic(topic.id)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isDone
                                  ? 'bg-[#7FBF7A]/10 border-[#7FBF7A]/30 text-[#13231F]'
                                  : 'bg-[#FCFBF8] border-[#E8E0CC] hover:bg-[#F5F1E6]/40 text-black/80'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                                    isDone
                                      ? 'bg-[#7FBF7A] text-white shadow-xs'
                                      : 'border border-[#C8C2AF] bg-white'
                                  }`}
                                >
                                  {isDone && <Check className="w-3.5 h-3.5" />}
                                </div>
                                <span
                                  className={`text-[13px] font-medium ${
                                    isDone ? 'line-through text-black/50' : 'text-[#13231F]'
                                  }`}
                                >
                                  {topic.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10.5px] font-mono text-black/50 bg-[#F5F1E6] px-2 py-0.5 rounded flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {topic.periods}p
                                </span>
                              </div>
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
  )
}
