export type Pit = {
  id: string
  trigger?: string
  examples?: string[]
  response: string
  ui?: string
  source?: string
}

export type ConceptItem = {
  id: string
  name: string
  topic?: string
  learning_goal: string
  prerequisites: string[]
  unlocks_next: string[]
  common_pitfall?: string
  hermes_guiding_question?: string
  key_formula?: string
  status?: 'locked' | 'available' | 'in-progress' | 'mastered'
}

export interface BlockProps {
  json?: any
  onEvent?: (event: LogEvent) => void
}

export type BlockJSON = any
export type LogEvent = { blockId: string; type: string; value: any; query?: string; timestamp: number }
