import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardCheck,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  X,
  Send,
  Award,
} from 'lucide-react'
import { useStudentStore, type StudentAssignmentItem } from '../../store/studentStore'

const SUBJECT_CHOICES = ['All', 'Mathematics', 'Science', 'English']
const STATUS_CHOICES = [
  { id: 'all', label: 'All' },
  { id: 'not_started', label: 'Not Started' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'graded', label: 'Graded' },
]

// ponytail: assignments don't yet carry a real per-question bank in the schema,
// and the backend's own auto-grader (student_learning.py) checks answers against
// a hardcoded sample set rather than a real answer key. These demo questions match
// that same fidelity. Upgrade path: link assignments to real question content, then
// fetch real questions here instead of this fixed set.
const DEMO_QUIZ_QUESTIONS = [
  { id: 'q1', prompt: 'Which option represents the correct final answer for this assignment?', options: ['Option A', 'Option B', 'Option C', 'Option D'] },
  { id: 'q2', prompt: 'Which of these best matches the expected working shown in class?', options: ['A', 'B', 'C', 'D'] },
  { id: 'q3', prompt: 'Select the answer that matches the textbook solution.', options: ['x = 3', 'x = 5', 'x = 7', 'x = 9'] },
]

function statusBadge(status: string) {
  if (status === 'graded') return 'bg-[#7FBF7A]/15 border-[#7FBF7A]/40 text-[#111814]'
  if (status === 'submitted') return 'bg-[#DDB56E]/15 border-[#DDB56E]/40 text-[#8C6D23]'
  return 'bg-[#F6F1E7]/80 border-[#EDE8DD] text-[#111814]/50'
}

export default function MyAssignmentsPage() {
  const { assignments, loading, fetchAssignments, submitAssignment } = useStudentStore()
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [quizAssignment, setQuizAssignment] = useState<StudentAssignmentItem | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizResult, setQuizResult] = useState<any>(null)

  const [writtenAssignment, setWrittenAssignment] = useState<StudentAssignmentItem | null>(null)
  const [writtenContent, setWrittenContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void fetchAssignments()
  }, [fetchAssignments])

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      const matchesSubject = subjectFilter === 'All' || a.subject === subjectFilter
      const matchesStatus = statusFilter === 'all' || a.submission_status === statusFilter
      const q = search.toLowerCase().trim()
      const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q)
      return matchesSubject && matchesStatus && matchesSearch
    })
  }, [assignments, subjectFilter, statusFilter, search])

  const dueTodayCount = assignments.filter((a) => {
    if (!a.due_date) return false
    const days = Math.floor((new Date(a.due_date).getTime() - Date.now()) / 86400000)
    return days === 0 && a.submission_status === 'not_started'
  }).length
  const overdueCount = assignments.filter((a) => {
    if (!a.due_date) return false
    return new Date(a.due_date).getTime() < Date.now() && a.submission_status === 'not_started'
  }).length
  const gradedCount = assignments.filter((a) => a.submission_status === 'graded').length

  function openQuiz(asg: StudentAssignmentItem) {
    setQuizAssignment(asg)
    setQuizAnswers({})
    setQuizResult(null)
  }

  async function handleQuizSubmit() {
    if (!quizAssignment) return
    setSubmitting(true)
    try {
      const answers = DEMO_QUIZ_QUESTIONS.map((q) => ({ question_id: q.id, selected: quizAnswers[q.id] || '' }))
      const result = await submitAssignment(quizAssignment.id, { submission_type: 'quiz', answers })
      setQuizResult(result)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleWrittenSubmit() {
    if (!writtenAssignment) return
    setSubmitting(true)
    try {
      await submitAssignment(writtenAssignment.id, { submission_type: 'written', content: writtenContent })
      setWrittenAssignment(null)
      setWrittenContent('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-[22px] lg:text-[26px] tracking-[-0.02em] font-medium text-[#111814] flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#1a2421]/5 text-[#111814] border border-[#EDE8DD]">
            <ClipboardCheck className="w-6 h-6 text-[#111814]" />
          </span>
          My Assignments
        </h1>
        <p className="text-[13px] text-[#8A8A7A] mt-1">Complete homework, take quizzes, and track feedback from your teacher.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-[#EDE8DD] shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-danger/10 flex items-center justify-center text-danger border border-danger/20 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#111814]/60 font-medium">Overdue</div>
            <div className="text-xl font-bold text-[#111814]">{overdueCount}</div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-[#EDE8DD] shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#DDB56E]/15 flex items-center justify-center text-[#8C6D23] border border-[#DDB56E]/30 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#111814]/60 font-medium">Due Today</div>
            <div className="text-xl font-bold text-[#111814]">{dueTodayCount}</div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#FCFBF8] border border-[#EDE8DD] shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#7FBF7A]/15 flex items-center justify-center text-[#111814] border border-[#7FBF7A]/30 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#111814]/60 font-medium">Graded</div>
            <div className="text-xl font-bold text-[#111814]">{gradedCount}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FCFBF8] border border-[#EDE8DD] shadow-card">
        <div className="flex flex-1 items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#111814]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assignments..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#EDE8DD]/70 bg-[#FAF9F5] text-[#111814] placeholder:text-[#111814]/40 focus:outline-none focus:border-[#DDB56E] transition-colors"
            />
          </div>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="text-xs py-2 px-2.5 rounded-xl border border-[#EDE8DD] bg-[#FAF9F5] text-[#111814] outline-none focus:border-[#DDB56E] shrink-0"
          >
            {SUBJECT_CHOICES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {STATUS_CHOICES.map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st.id ? 'bg-[#1a2421] text-white shadow-xs' : 'bg-[#F5F1E6] text-[#111814]/70 hover:text-[#111814]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#111814]/50 flex flex-col items-center gap-2">
          <span className="w-6 h-6 border-2 border-[#1a2421]/30 border-t-[#1a2421] rounded-full animate-spin" />
          <span className="text-sm">Loading assignments...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-[#FCFBF8] border border-dashed border-[#EDE8DD] rounded-2xl p-8">
          <ClipboardCheck className="w-10 h-10 text-[#111814]/30 mx-auto mb-2" />
          <p className="text-sm text-[#111814]/60">No assignments match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((asg) => {
            const formattedDate = asg.due_date
              ? new Date(asg.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : null
            const isDone = asg.submission_status === 'submitted' || asg.submission_status === 'graded'

            return (
              <div key={asg.id} className="bg-[#FCFBF8] border border-[#EDE8DD] rounded-2xl p-5 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#1a2421]/5 text-[#111814] border border-[#EDE8DD]">
                      {asg.subject}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusBadge(asg.submission_status)}`}>
                      {asg.submission_status === 'not_started' ? 'Not Started' : asg.submission_status.charAt(0).toUpperCase() + asg.submission_status.slice(1)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base text-[#111814] leading-snug line-clamp-2 mb-1.5">{asg.title}</h3>
                  <p className="text-xs text-[#111814]/65 line-clamp-2 leading-relaxed mb-3">{asg.description || 'No instructions provided.'}</p>

                  {asg.submission_status === 'graded' && (
                    <div className="mb-3 p-2.5 rounded-xl bg-[#7FBF7A]/10 border border-[#7FBF7A]/30 text-xs">
                      <span className="font-semibold text-[#111814]">Score: {asg.score}/{asg.total_points}</span>
                      {asg.feedback && <p className="text-[#111814]/60 mt-1">{asg.feedback}</p>}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#EDE8DD]/60 flex items-center justify-between text-xs">
                  {formattedDate ? (
                    <div className="flex items-center gap-1.5 text-[#111814]/75 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#DDB56E]" />
                      <span>Due {formattedDate}</span>
                    </div>
                  ) : (
                    <span className="text-[#111814]/40">No due date</span>
                  )}

                  {isDone ? (
                    <span className="flex items-center gap-1 text-[#111814]/50 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#7FBF7A]" /> Done
                    </span>
                  ) : asg.type === 'homework' || asg.type === 'practice' ? (
                    <button
                      onClick={() => openQuiz(asg)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1a2421] hover:bg-black text-white cursor-pointer"
                    >
                      Take Quiz
                    </button>
                  ) : (
                    <button
                      onClick={() => { setWrittenAssignment(asg); setWrittenContent('') }}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1a2421] hover:bg-black text-white cursor-pointer"
                    >
                      Submit Work
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quiz Runner Modal */}
      {quizAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a2421]/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#FCFBF8] border border-[#EDE8DD] rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#111814] text-base">{quizAssignment.title}</h3>
              <button onClick={() => setQuizAssignment(null)} className="text-[#111814]/40 hover:text-[#111814] p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {quizResult ? (
              <div className="space-y-3 text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-[#7FBF7A] mx-auto" />
                <div className="text-2xl font-bold text-[#111814]">{quizResult.score} / {quizResult.max_score}</div>
                <p className="text-sm text-[#111814]/60">
                  {quizResult.correct_count} of {quizResult.total_questions} correct · +{quizResult.xp_awarded} XP
                </p>
                <button
                  onClick={() => setQuizAssignment(null)}
                  className="px-4 py-2 rounded-full bg-[#1a2421] text-white text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {DEMO_QUIZ_QUESTIONS.map((q, idx) => (
                    <div key={q.id}>
                      <label className="block text-xs font-semibold text-[#111814]/70 mb-1.5">
                        {idx + 1}. {q.prompt}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })}
                            className={`text-xs px-3 py-2 rounded-lg border text-left cursor-pointer transition-colors ${
                              quizAnswers[q.id] === opt
                                ? 'bg-[#1a2421] text-white border-[#1a2421]'
                                : 'bg-white border-[#EDE8DD] text-[#111814] hover:border-[#DDB56E]'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => void handleQuizSubmit()}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1a2421] hover:bg-black text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-[#DDB56E]" />
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Written Submission Modal */}
      {writtenAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a2421]/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#FCFBF8] border border-[#EDE8DD] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#111814] text-base">{writtenAssignment.title}</h3>
              <button onClick={() => setWrittenAssignment(null)} className="text-[#111814]/40 hover:text-[#111814] p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={6}
              value={writtenContent}
              onChange={(e) => setWrittenContent(e.target.value)}
              placeholder="Type your response or notes for the teacher to review..."
              className="w-full p-3 rounded-xl border border-[#EDE8DD] bg-white text-sm text-[#111814] outline-none focus:border-[#DDB56E] resize-y"
            />
            <button
              onClick={() => void handleWrittenSubmit()}
              disabled={submitting || !writtenContent.trim()}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1a2421] hover:bg-black text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-[#DDB56E]" />
              {submitting ? 'Submitting...' : 'Submit for Grading'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
