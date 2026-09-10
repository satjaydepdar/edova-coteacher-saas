export interface BM25Document {
  id: string
  title: string
  equation?: string
  theme?: string
  difficulty?: string
  desc?: string
  chapterId?: string
  subtopicId?: string
  subjectId?: string
  [key: string]: any
}

export interface BM25SearchResult<T = BM25Document> {
  doc: T
  score: number
}

export class BM25Engine<T extends BM25Document> {
  private k1: number
  private b: number
  private docs: T[]
  private docLengths: number[] = []
  private docTokens: string[][] = []
  private df: Record<string, number> = {}
  private N: number
  private avgdl: number = 1

  constructor(docs: T[], k1 = 1.2, b = 0.75) {
    this.k1 = k1
    this.b = b
    this.docs = docs
    this.N = docs.length
    this.avgdl = 1
    this.buildIndex()
  }

  public updateDocs(docs: T[]) {
    this.docs = docs
    this.N = docs.length
    this.docLengths = []
    this.docTokens = []
    this.df = {}
    this.buildIndex()
  }

  private tokenize(text: string): string[] {
    if (!text) return []
    return (
      text
        .toLowerCase()
        .replace(/[^a-z0-9²±\s]/g, ' ')
        .match(/[a-z0-9²±]+/g) || []
    )
  }

  private buildIndex() {
    this.docs.forEach((doc, idx) => {
      const combinedText = `${doc.title || ''} ${doc.equation || ''} ${doc.theme || ''} ${
        doc.desc || ''
      } ${doc.difficulty || ''} ${doc.subtopicId || ''} ${doc.chapterId || ''}`
      const tokens = this.tokenize(combinedText)
      this.docTokens[idx] = tokens
      this.docLengths[idx] = tokens.length

      const uniqueTokens = new Set(tokens)
      uniqueTokens.forEach((token) => {
        this.df[token] = (this.df[token] || 0) + 1
      })
    })

    const totalLength = this.docLengths.reduce((sum, len) => sum + len, 0)
    this.avgdl = this.N > 0 ? totalLength / this.N : 1
  }

  public search(query: string): BM25SearchResult<T>[] {
    const qTokens = this.tokenize(query)
    if (qTokens.length === 0) {
      return this.docs.map((doc) => ({ doc, score: 1 }))
    }

    const results: BM25SearchResult<T>[] = []

    this.docs.forEach((doc, idx) => {
      let score = 0
      const tokens = this.docTokens[idx] || []
      const len = this.docLengths[idx] || 1

      const tokenFreq: Record<string, number> = {}
      tokens.forEach((t) => {
        tokenFreq[t] = (tokenFreq[t] || 0) + 1
      })

      qTokens.forEach((q) => {
        const dfVal = this.df[q] || 0
        if (dfVal === 0) return

        const idf = Math.log((this.N - dfVal + 0.5) / (dfVal + 0.5) + 1)
        const tf = tokenFreq[q] || 0
        if (tf === 0) return

        const numerator = tf * (this.k1 + 1)
        const denominator = tf + this.k1 * (1 - this.b + this.b * (len / this.avgdl))

        score += idf * (numerator / denominator)
      })

      if (score > 0) {
        results.push({ doc, score })
      }
    })

    return results.sort((a, b) => b.score - a.score)
  }
}
