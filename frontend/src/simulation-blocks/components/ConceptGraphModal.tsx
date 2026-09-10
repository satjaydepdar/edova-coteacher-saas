import React from 'react'
import { ConceptItem } from '../types'

interface ConceptGraphModalProps {
  isOpen: boolean
  onClose: () => void
  activeConceptId?: string
  masteredConceptIds: string[]
  onSelectConcept?: (conceptId: string) => void
  onAskHermes?: (question: string) => void
  concepts?: ConceptItem[]
}

export const DEFAULT_QUADRATIC_CONCEPTS: ConceptItem[] = [
  {
    id: 'QUAD-01',
    name: 'Standard Form of Quadratic Equation',
    learning_goal: 'Understand the general form ax² + bx + c = 0 where a ≠ 0.',
    prerequisites: [],
    unlocks_next: ['QUAD-02', 'QUAD-03'],
    key_formula: 'ax² + bx + c = 0',
    hermes_guiding_question: 'What happens if a = 0? The equation ceases to be quadratic and becomes linear!'
  },
  {
    id: 'QUAD-02',
    name: 'Geometric Area Models',
    learning_goal: 'Represent quadratic relationships as rectangular area models (Length × Breadth).',
    prerequisites: ['QUAD-01'],
    unlocks_next: ['QUAD-03'],
    key_formula: 'Area = x · (2x + 1) = 528 m²',
    hermes_guiding_question: 'How do the algebraic dimensions (x and 2x+1) map to geometric rectangles?'
  },
  {
    id: 'QUAD-03',
    name: 'AC Splitting Middle Term Method',
    learning_goal: 'Find factors p and q such that p · q = a · c and p + q = b.',
    prerequisites: ['QUAD-01'],
    unlocks_next: ['QUAD-04'],
    key_formula: 'ac = 2 · (-528) = -1056; p+q = 1',
    hermes_guiding_question: 'Which two integers multiply to -1056 and have a difference of +1? Look at 33 and -32!'
  },
  {
    id: 'QUAD-04',
    name: 'Factorization & Binomial Grouping',
    learning_goal: 'Group quadratic expressions into pairs of linear binomial factors.',
    prerequisites: ['QUAD-03'],
    unlocks_next: ['QUAD-05'],
    key_formula: '(2x + 33)(x − 16) = 0',
    hermes_guiding_question: 'When grouping 2x(x - 16) + 33(x - 16), notice the common factor (x - 16)!'
  },
  {
    id: 'QUAD-05',
    name: 'Zero-Product Property & Root Rejection',
    learning_goal: 'Set factors to zero to find roots, discarding extraneous negative roots for geometric measures.',
    prerequisites: ['QUAD-04'],
    unlocks_next: ['QUAD-06'],
    key_formula: 'x = 16 (Breadth > 0; discard x = -16.5)',
    hermes_guiding_question: 'Can a park have a negative breadth of -16.5 meters? Always validate physical constraints!'
  },
  {
    id: 'QUAD-06',
    name: 'Quadratic Formula & Discriminant (D)',
    learning_goal: 'Use x = (-b ± √D)/(2a) with D = b² - 4ac to assess real, distinct, or no real roots.',
    prerequisites: ['QUAD-01'],
    unlocks_next: [],
    key_formula: 'D = b² − 4ac; x = (−b ± √D)/(2a)',
    hermes_guiding_question: 'What does D > 0 tell us about the nature and count of the quadratic roots?'
  }
]

export const DEFAULT_AP_CONCEPTS: ConceptItem[] = [
  {
    id: 'AP-01',
    name: 'Number Patterns & Sequences',
    learning_goal: 'Recognize sequences as ordered lists following a mathematical rule.',
    prerequisites: [],
    unlocks_next: ['AP-02', 'AP-03'],
    key_formula: 'a₁, a₂, a₃ ... aₙ',
    hermes_guiding_question: 'Look at the jump between each pair: are we adding the exact same amount each step?'
  },
  {
    id: 'AP-02',
    name: 'Definition of a Term (aₖ)',
    learning_goal: 'Understand that each number in a sequence has a position-based rank.',
    prerequisites: ['AP-01'],
    unlocks_next: ['AP-04'],
    key_formula: 'Position k → Term aₖ',
    hermes_guiding_question: 'Remember: n is the position number, while aₙ is the actual number sitting in that spot!'
  },
  {
    id: 'AP-03',
    name: 'Definition of an AP',
    learning_goal: 'Define an AP as a list where each term is formed by adding a fixed constant.',
    prerequisites: ['AP-01'],
    unlocks_next: ['AP-05'],
    key_formula: 'aₖ₊₁ = aₖ + d',
    hermes_guiding_question: 'Does every consecutive pair have the exact same step size from start to finish?'
  },
  {
    id: 'AP-04',
    name: 'First Term (a or a₁)',
    learning_goal: 'Identify "a" as the initial anchor value of any progression.',
    prerequisites: ['AP-02'],
    unlocks_next: ['AP-06'],
    key_formula: 'a = a₁',
    hermes_guiding_question: 'Which number is in the very first spot (position 1) of the list?'
  },
  {
    id: 'AP-05',
    name: 'Common Difference (d)',
    learning_goal: 'Calculate d = aₖ₊₁ - aₖ, recognizing d can be positive, negative, or zero.',
    prerequisites: ['AP-03'],
    unlocks_next: ['AP-06', 'AP-08'],
    key_formula: 'd = aₖ₊₁ - aₖ',
    hermes_guiding_question: 'Always subtract earlier from later (a₂ − a₁). If decreasing, d must be negative!'
  },
  {
    id: 'AP-06',
    name: 'General Form of an AP',
    learning_goal: 'Express an AP algebraically as a, a+d, a+2d ... a+(n-1)d.',
    prerequisites: ['AP-04', 'AP-05'],
    unlocks_next: ['AP-07', 'AP-09'],
    key_formula: 'a, a+d, a+2d ...',
    hermes_guiding_question: 'Notice term 1 has 0 d\'s, term 2 has 1 d, term 3 has 2 d\'s. How many d\'s in term n?'
  },
  {
    id: 'AP-07',
    name: 'Finite vs. Infinite APs',
    learning_goal: 'Differentiate between an AP with a last term (l) and an unending AP.',
    prerequisites: ['AP-06'],
    unlocks_next: ['AP-10'],
    key_formula: 'Finite has last term l',
    hermes_guiding_question: 'Does this list stop at a final number, or does it have three dots (...) showing it continues?'
  },
  {
    id: 'AP-08',
    name: 'AP Identification Test',
    learning_goal: 'Verify if a₂ - a₁ = a₃ - a₂ = constant holds across all consecutive pairs.',
    prerequisites: ['AP-05'],
    unlocks_next: ['AP-23'],
    key_formula: 'aₖ₊₁ - aₖ = constant',
    hermes_guiding_question: 'Did you check the difference between the 2nd and 3rd terms too, or just the first pair?'
  },
  {
    id: 'AP-09',
    name: 'nth Term Formula (aₙ)',
    learning_goal: 'Compute any distant term using aₙ = a + (n - 1)d directly.',
    prerequisites: ['AP-06'],
    unlocks_next: ['AP-10', 'AP-11', 'AP-13', 'AP-16', 'AP-17'],
    key_formula: 'aₙ = a + (n − 1)d',
    hermes_guiding_question: 'Why multiply d by (n - 1)? Remember, we didn\'t add any d to get the first term!'
  },
  {
    id: 'AP-10',
    name: 'Last Term of Finite AP (l)',
    learning_goal: 'Identify the final term of an n-term AP as l = a + (n - 1)d.',
    prerequisites: ['AP-07', 'AP-09'],
    unlocks_next: ['AP-15', 'AP-18'],
    key_formula: 'l = a + (n − 1)d',
    hermes_guiding_question: 'If the series has n items, what is the value of the term sitting at position n?'
  },
  {
    id: 'AP-11',
    name: 'Finding Term Count (n)',
    learning_goal: 'Solve linear equation for n given aₙ, a, and d.',
    prerequisites: ['AP-09'],
    unlocks_next: ['AP-12', 'AP-14'],
    key_formula: 'n = (aₙ − a)/d + 1',
    hermes_guiding_question: 'First subtract a from both sides, then divide by d, and finally add 1.'
  },
  {
    id: 'AP-12',
    name: 'Membership Validation in AP',
    learning_goal: 'Confirm a number belongs to an AP if position n is a positive integer.',
    prerequisites: ['AP-11'],
    unlocks_next: [],
    key_formula: 'n ∈ {1, 2, 3, ...}',
    hermes_guiding_question: 'Can a term occupy position 33.5 or position -4? Position n must be a positive integer!'
  },
  {
    id: 'AP-13',
    name: 'Determining AP from 2 Terms',
    learning_goal: 'Find a and d by solving simultaneous linear equations from two known terms.',
    prerequisites: ['AP-09'],
    unlocks_next: [],
    key_formula: 'a + (p-1)d = aₚ',
    hermes_guiding_question: 'What happens if we subtract the first equation from the second to eliminate a?'
  },
  {
    id: 'AP-14',
    name: 'Divisibility in a Range',
    learning_goal: 'Count multiples in an interval using first multiple a and last multiple l.',
    prerequisites: ['AP-11'],
    unlocks_next: [],
    key_formula: 'a = 1st mult, d = divisor',
    hermes_guiding_question: 'What is the very first number inside your range that is actually divisible?'
  },
  {
    id: 'AP-15',
    name: 'nth Term from the End',
    learning_goal: 'Calculate terms backwards using l - (n - 1)d or by reversing the sequence.',
    prerequisites: ['AP-10', 'AP-09'],
    unlocks_next: [],
    key_formula: 'aₙ\' = l − (n − 1)d',
    hermes_guiding_question: 'If you reverse the list, the last term becomes the new first term and d flips sign!'
  },
  {
    id: 'AP-16',
    name: 'Real-World nth Term Problems',
    learning_goal: 'Translate real situations (salary increments, ladder rungs) into a, d, n.',
    prerequisites: ['AP-09'],
    unlocks_next: ['AP-22'],
    key_formula: 'Linear Growth Models',
    hermes_guiding_question: 'Is that number the amount added each year (d), or the final target total (aₙ)?'
  },
  {
    id: 'AP-17',
    name: 'Sum of First n Terms (Sₙ)',
    learning_goal: 'Compute total sum using Sₙ = (n/2)[2a + (n - 1)d].',
    prerequisites: ['AP-09'],
    unlocks_next: ['AP-18', 'AP-20', 'AP-21', 'AP-22'],
    key_formula: 'Sₙ = (n/2)[2a + (n − 1)d]',
    hermes_guiding_question: 'Check inside the bracket: did you write 2a or just a? It must be 2a!'
  },
  {
    id: 'AP-18',
    name: 'Sum with First & Last Term',
    learning_goal: 'Calculate sum quickly using Sₙ = (n/2)(a + l) when l is known.',
    prerequisites: ['AP-10', 'AP-17'],
    unlocks_next: ['AP-19'],
    key_formula: 'Sₙ = (n/2)(a + l)',
    hermes_guiding_question: 'We know a and l, but do we know n yet? Find n first using aₙ = a + (n-1)d!'
  },
  {
    id: 'AP-19',
    name: 'Sum of n Natural Numbers',
    learning_goal: 'Apply Gaussian closed form Sₙ = n(n + 1)/2 for positive integers 1 to n.',
    prerequisites: ['AP-18'],
    unlocks_next: [],
    key_formula: 'Sₙ = n(n + 1)/2',
    hermes_guiding_question: 'Notice this only works when the list starts at 1 and increments by 1!'
  },
  {
    id: 'AP-20',
    name: 'Relation: aₙ = Sₙ − Sₙ₋₁',
    learning_goal: 'Extract any term directly from a given sum expression Sₙ.',
    prerequisites: ['AP-17'],
    unlocks_next: [],
    key_formula: 'aₙ = Sₙ − Sₙ₋₁',
    hermes_guiding_question: 'If you remove the sum of the first (n - 1) terms from the sum of all n terms, what remains?'
  },
  {
    id: 'AP-21',
    name: 'Quadratic Sₙ & Double n Values',
    learning_goal: 'Solve quadratic in n from Sₙ and interpret why two n values can give identical sums.',
    prerequisites: ['AP-17'],
    unlocks_next: [],
    key_formula: 'An² + Bn − Sₙ = 0',
    hermes_guiding_question: 'Why are both n values valid? Look at the sequence: negative terms cancel positive ones out!'
  },
  {
    id: 'AP-22',
    name: 'Cumulative Real-World Sums',
    learning_goal: 'Model real problems (tiered logs, semicircle spirals, relay distances) as AP sums.',
    prerequisites: ['AP-16', 'AP-17'],
    unlocks_next: [],
    key_formula: 'Total = Σ aᵢ',
    hermes_guiding_question: 'Does the question ask for the cost on day 30 alone, or the cumulative sum across all 30 days?'
  },
  {
    id: 'AP-23',
    name: 'Arithmetic Mean (AM)',
    learning_goal: 'Understand that for three terms in AP (a, b, c), middle term is b = (a + c)/2.',
    prerequisites: ['AP-08'],
    unlocks_next: [],
    key_formula: 'b = (a + c)/2',
    hermes_guiding_question: 'If b − a = c − b, add b and a to both sides to get 2b = a + c!'
  }
]

interface ConceptGraphModalProps {
  isOpen: boolean
  onClose: () => void
  chapterTitle?: string
  activeConceptId?: string
  masteredConceptIds: string[]
  onSelectConcept?: (conceptId: string) => void
  onAskHermes?: (question: string) => void
  concepts?: ConceptItem[]
}

export default function ConceptGraphModal({
  isOpen,
  onClose,
  chapterTitle = 'Chapter Knowledge Graph',
  activeConceptId = 'QUAD-02',
  masteredConceptIds = [],
  onSelectConcept,
  onAskHermes,
  concepts = DEFAULT_QUADRATIC_CONCEPTS
}: ConceptGraphModalProps) {
  if (!isOpen) return null

  const masteredSet = new Set(masteredConceptIds)
  const totalConcepts = concepts.length
  const masteredCount = concepts.filter((c) => masteredSet.has(c.id)).length
  const masteryPercentage = Math.round((masteredCount / (totalConcepts || 1)) * 100)

  const getConceptStatus = (c: ConceptItem) => {
    if (masteredSet.has(c.id)) return 'mastered'
    if (c.id === activeConceptId) return 'in-progress'
    const hasPrereqs = c.prerequisites.length === 0 || c.prerequisites.every((p) => masteredSet.has(p))
    return hasPrereqs ? 'available' : 'locked'
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6 select-none animate-fadeIn font-ui">
      <div className="bg-white border border-black/[0.08] rounded-[24px] shadow-2xl w-full max-w-[1000px] max-h-[90vh] flex flex-col overflow-hidden z-[101] text-forest">
        {/* Header */}
        <div className="p-6 border-b border-black/[0.06] flex items-center justify-between bg-cream">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-forest text-white">
                Knowledge Graph
              </span>
              <h2 className="font-display text-xl font-bold text-forest tracking-tight">
                {chapterTitle}
              </h2>
            </div>
            <p className="text-[13px] text-forest/70 mt-1">
              Interactive concept dependency roadmap. Master prerequisites to unlock downstream concepts.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-black/5 border border-black/10 text-forest flex items-center justify-center transition-colors cursor-pointer text-base font-bold shadow-xs"
            title="Close (✕)"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar Header */}
        <div className="px-6 py-4 bg-white border-b border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="text-[13px] font-bold text-forest">
              Chapter Mastery: <span className="text-forest underline font-black">{masteredCount}/{totalConcepts}</span> Concepts
            </div>
            <div className="w-36 h-2 bg-cream border border-black/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${masteryPercentage}%` }}
              />
            </div>
            <span className="text-[12px] font-bold text-forest/60">{masteryPercentage}%</span>
          </div>

          <div className="flex items-center gap-4 text-[12px] text-forest/60">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Mastered</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gold"></span> In Progress</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-forest/30"></span> Available</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-black/10"></span> Locked</span>
          </div>
        </div>

        {/* Concept Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-cream">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {concepts.map((c) => {
              const status = getConceptStatus(c)
              const isCurrent = c.id === activeConceptId

              return (
                <div
                  key={c.id}
                  onClick={() => onSelectConcept?.(c.id)}
                  className={`p-4 rounded-[16px] border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                    status === 'mastered'
                      ? 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-400 shadow-xs'
                      : status === 'in-progress'
                      ? 'bg-white border-gold ring-2 ring-gold/40 shadow-md'
                      : status === 'available'
                      ? 'bg-white border-black/[0.08] hover:border-black/20 shadow-card hover:-translate-y-[1px]'
                      : 'bg-white/60 border-black/[0.04] opacity-50'
                  }`}
                >
                  <div>
                    {/* Top Row: ID + Status Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-cream border border-black/[0.08] text-forest">
                        {c.id}
                      </span>
                      {status === 'mastered' && (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          ✓ Mastered
                        </span>
                      )}
                      {status === 'in-progress' && (
                        <span className="text-[11px] font-bold text-amber-700 animate-pulse flex items-center gap-1">
                          ● Active
                        </span>
                      )}
                      {status === 'available' && (
                        <span className="text-[11px] font-medium text-forest/60">
                          Ready
                        </span>
                      )}
                      {status === 'locked' && (
                        <span className="text-[11px] font-medium text-forest/40">
                          🔒 Locked
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-[14px] font-bold text-forest mb-1 leading-snug">
                      {c.name}
                    </h3>
                    <p className="text-[12px] text-forest/70 line-clamp-2 leading-relaxed mb-3">
                      {c.learning_goal}
                    </p>

                    {c.key_formula && (
                      <div className="bg-cream border border-black/[0.06] rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold text-forest mb-3">
                        {c.key_formula}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-black/[0.06] flex flex-col gap-2.5">
                    {/* Prerequisites */}
                    {c.prerequisites.length > 0 && (
                      <div className="text-[11px] text-forest/60">
                        <span>Prereqs: </span>
                        {c.prerequisites.map((p) => (
                          <span
                            key={p}
                            className={`inline-block px-1.5 py-0.2 rounded-md ml-1 font-mono text-[10px] font-bold ${
                              masteredSet.has(p)
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-cream text-forest/60 border border-black/[0.08]'
                            }`}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (c.hermes_guiding_question) {
                          onAskHermes?.(`Help me understand ${c.name} (${c.id}): ${c.hermes_guiding_question}`)
                          onClose()
                        }
                      }}
                      className="w-full py-1.5 px-3 rounded-xl text-[12px] font-medium bg-forest hover:bg-forest-raised text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>💬 Ask Hermes Co-Teacher</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
