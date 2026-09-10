import { SimulationItem } from '../data/curriculumData'

export interface ParsedSearchIntent {
  rawQuery: string
  detectedDifficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  detectedTopic?: string
  detectedChapterId?: string
  conceptKeywords: string[]
}

export interface IntelligentSearchResult {
  rankedSimulations: SimulationItem[]
  parsedIntent: ParsedSearchIntent
  totalMatches: number
}

// Map common keywords to standard difficulties
const DIFFICULTY_KEYWORDS: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
  beginner: 'Beginner',
  easy: 'Beginner',
  basic: 'Beginner',
  starter: 'Beginner',
  intro: 'Beginner',
  level1: 'Beginner',
  'level 1': 'Beginner',

  intermediate: 'Intermediate',
  medium: 'Intermediate',
  moderate: 'Intermediate',
  mod: 'Intermediate',
  level2: 'Intermediate',
  'level 2': 'Intermediate',

  advanced: 'Advanced',
  hard: 'Advanced',
  complex: 'Advanced',
  expert: 'Advanced',
  challenging: 'Advanced',
  level3: 'Advanced',
  'level 3': 'Advanced'
}

// Map common topic keywords to chapter and subtopic scopes
const TOPIC_KEYWORDS: Record<string, { topicName: string; chapterId: string }> = {
  linear: { topicName: 'Pair of Linear Equations', chapterId: 'algebra' },
  'linear equation': { topicName: 'Pair of Linear Equations', chapterId: 'algebra' },
  'linear equations': { topicName: 'Pair of Linear Equations', chapterId: 'algebra' },
  'intersecting lines': { topicName: 'Pair of Linear Equations', chapterId: 'algebra' },
  elimination: { topicName: 'Pair of Linear Equations', chapterId: 'algebra' },
  substitution: { topicName: 'Pair of Linear Equations', chapterId: 'algebra' },

  quadratic: { topicName: 'Quadratic Equations', chapterId: 'algebra' },
  quadratics: { topicName: 'Quadratic Equations', chapterId: 'algebra' },
  parabola: { topicName: 'Quadratic Equations', chapterId: 'algebra' },

  ap: { topicName: 'Arithmetic Progressions', chapterId: 'algebra' },
  progression: { topicName: 'Arithmetic Progressions', chapterId: 'algebra' },
  'arithmetic progression': { topicName: 'Arithmetic Progressions', chapterId: 'algebra' },
  'common difference': { topicName: 'Arithmetic Progressions', chapterId: 'algebra' },

  polynomial: { topicName: 'Polynomials', chapterId: 'algebra' },
  polynomials: { topicName: 'Polynomials', chapterId: 'algebra' },

  trig: { topicName: 'Trigonometry', chapterId: 'trigonometry' },
  trigonometry: { topicName: 'Trigonometry', chapterId: 'trigonometry' },

  geometry: { topicName: 'Geometry', chapterId: 'geometry' },
  triangles: { topicName: 'Triangles', chapterId: 'geometry' },
  circles: { topicName: 'Circles', chapterId: 'geometry' },

  statistics: { topicName: 'Statistics', chapterId: 'stats-prob' },
  stats: { topicName: 'Statistics', chapterId: 'stats-prob' },
  mean: { topicName: 'Central Tendency', chapterId: 'stats-prob' },
  median: { topicName: 'Central Tendency', chapterId: 'stats-prob' },

  mensuration: { topicName: 'Mensuration', chapterId: 'mensuration' },
  area: { topicName: 'Areas & Volumes', chapterId: 'mensuration' },
  volume: { topicName: 'Areas & Volumes', chapterId: 'mensuration' }
}

/**
 * Natural language intent parser for search queries.
 * Extracts difficulty, topic, and concept tokens from free-form student queries.
 */
export function parseSearchIntent(query: string): ParsedSearchIntent {
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery) {
    return { rawQuery: '', conceptKeywords: [] }
  }

  let remainingText = normalizedQuery
  let detectedDifficulty: 'Beginner' | 'Intermediate' | 'Advanced' | undefined
  let detectedTopic: string | undefined
  let detectedChapterId: string | undefined

  // 1. Extract Difficulty keywords
  for (const [kw, diff] of Object.entries(DIFFICULTY_KEYWORDS)) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i')
    if (regex.test(remainingText)) {
      detectedDifficulty = diff
      remainingText = remainingText.replace(regex, ' ').trim()
      break
    }
  }

  // 2. Extract Topic / Chapter keywords
  for (const [kw, info] of Object.entries(TOPIC_KEYWORDS)) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i')
    if (regex.test(remainingText)) {
      detectedTopic = info.topicName
      detectedChapterId = info.chapterId
      break
    }
  }

  // 3. Extract clean concept tokens
  const conceptKeywords = remainingText
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1)

  return {
    rawQuery: query,
    detectedDifficulty,
    detectedTopic,
    detectedChapterId,
    conceptKeywords
  }
}

/**
 * Intelligent Multi-Field Weighted Search Engine
 */
export function searchSimulationsIntelligently(
  simulations: SimulationItem[],
  query: string,
  activeSubTopicId?: string | null
): IntelligentSearchResult {
  const parsedIntent = parseSearchIntent(query)

  if (!query.trim()) {
    const filtered = activeSubTopicId
      ? simulations.filter((s) => s.subtopicId === activeSubTopicId)
      : simulations
    return {
      rankedSimulations: filtered,
      parsedIntent,
      totalMatches: filtered.length
    }
  }

  const { detectedDifficulty, detectedChapterId, conceptKeywords } = parsedIntent

  const scoredSimulations = simulations.map((sim) => {
    let score = 0

    // Match Difficulty
    if (detectedDifficulty) {
      if (sim.difficulty.toLowerCase() === detectedDifficulty.toLowerCase()) {
        score += 25
      } else {
        score -= 15
      }
    }

    // Match Topic / Subtopic Scope
    if (detectedChapterId && sim.chapterId === detectedChapterId) {
      score += 15
    }
    if (activeSubTopicId && sim.subtopicId === activeSubTopicId) {
      score += 10
    }

    const simTitle = sim.title.toLowerCase()
    const simDesc = (sim.desc || '').toLowerCase()
    const simEq = (sim.equation || '').toLowerCase()
    const simTheme = (sim.theme || '').toLowerCase()

    // Match Concept Tokens
    for (const token of conceptKeywords) {
      const term = token.toLowerCase()

      if (simTitle.includes(term)) score += 20
      if (simEq.includes(term)) score += 15
      if (simTheme.includes(term)) score += 12
      if (simDesc.includes(term)) score += 8
    }

    // Exact phrase full query boost
    const fullQ = query.toLowerCase().trim()
    if (simTitle.includes(fullQ)) score += 40
    if (simDesc.includes(fullQ)) score += 25

    return { sim, score }
  })

  const validResults = scoredSimulations
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.sim)

  return {
    rankedSimulations: validResults,
    parsedIntent,
    totalMatches: validResults.length
  }
}
