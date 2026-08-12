import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, FlaskConical, ListChecks, Lock, Play, Search } from 'lucide-react'
import { useWorkspace } from '../components/Shell'
import type { Module, ModuleType } from '../lib/api'

const TYPE_ICON: Record<ModuleType, typeof Play> = {
  VIDEO: Play,
  LAB: FlaskConical,
  QUIZ: ListChecks,
}

export default function Lessons() {
  const { tree, treeError, chapterId, typeFilter, features } = useWorkspace()
  const navigate = useNavigate()

  const modules = useMemo(() => {
    const out: (Module & { chapter_name: string; topic_name: string })[] = []
    for (const c of tree?.chapters ?? []) {
      if (chapterId !== 'ALL' && c.chapter_id !== chapterId) continue
      for (const t of c.topics) {
        for (const m of t.modules) {
          if (typeFilter !== 'ALL' && m.type !== typeFilter) continue
          out.push({ ...m, chapter_name: c.chapter_name, topic_name: t.topic_name ?? 'General' })
        }
      }
    }
    return out
  }, [tree, chapterId, typeFilter])

  const allowed: Record<ModuleType, boolean | undefined> = {
    VIDEO: features?.allow_video,
    LAB: features?.allow_lab,
    QUIZ: features?.allow_quiz,
  }

  if (treeError) {
    return (
      <div className="p-4 lg:p-6 max-w-[1440px] mx-auto">
        <div className="bg-white rounded-2xl border border-black/[0.06] p-8 text-center">
          <p className="text-[14px] font-medium text-ink">Could not load this shelf</p>
          <p className="text-[12px] opacity-60 mt-1">{treeError}</p>
        </div>
      </div>
    )
  }

  if (!tree) {
    return (
      <div className="p-4 lg:p-6 flex justify-center pt-24">
        <span className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-[22px] font-bold tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-8 rounded-full inline-block bg-gold" />
          {tree.subject_name}
          <span className="ml-2 text-[12px] font-normal opacity-50 bg-white border border-black/10 px-2 py-0.5 rounded-full">
            {modules.length} items
          </span>
        </h2>
        <div className="hidden sm:flex items-center gap-2 text-[12px] opacity-60">
          <Search className="w-3.5 h-3.5" /> Filter by chapter & type
        </div>
      </div>

      {tree.chapters.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[14px] font-medium">No published content yet</p>
          <p className="text-[12px] opacity-60 mt-1">
            This subject has no chapters with published modules.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {modules.map((m) => {
          const Icon = TYPE_ICON[m.type]
          const locked = m.locked || allowed[m.type] === false
          return (
            <button
              key={m.module_id}
              onClick={() => !locked && navigate(`/module/${m.module_id}`)}
              disabled={locked}
              className={`group text-left bg-white rounded-[18px] border border-black/[0.06] overflow-hidden shadow-card transition-all ${
                locked
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:shadow-card-hover hover:-translate-y-[1px]'
              }`}
            >
              <div className="aspect-[16/9] bg-ink relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {locked ? (
                    <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white/70" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-105">
                      <Icon className="w-5 h-5 ml-0.5 text-black" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium bg-black/70 backdrop-blur text-white px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {m.type}
                  </span>
                  <span className="text-[10px] font-semibold tracking-wide uppercase bg-gold text-black px-2 py-1 rounded-full">
                    {locked ? 'Locked' : m.chapter_name}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-display font-semibold text-[14px] leading-snug line-clamp-2 group-hover:text-[#8A6A2E] transition-colors">
                  {m.title}
                </h3>
                <div className="flex items-center gap-2 mt-2.5 text-[11px] opacity-60">
                  <span>{m.topic_name}</span>
                  {locked && (
                    <span className="ml-auto text-amber-700 font-medium">
                      Not in your plan
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {tree.chapters.length > 0 && modules.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-white border flex items-center justify-center mb-3">
            <Search className="w-5 h-5 opacity-30" />
          </div>
          <p className="text-[14px] font-medium">No items for this filter</p>
          <p className="text-[12px] opacity-60 mt-1">Try changing chapter or type</p>
        </div>
      )}
    </div>
  )
}
