import { useEffect, useState } from 'react'
import CoteacherWorkspace from './CoteacherWorkspace'
import { trigApi, type TrigConceptSummary } from '../../lib/trig/trigApiClient'

/** Top-level entry point for Trigonometry practice: loads the 10-concept DAG,
 *  picks a starting concept, and renders the workspace. This is what
 *  Practice.tsx now shows instead of the old generic chapter-practice UI. */
export default function TrigonometryPractice() {
  const [concepts, setConcepts] = useState<TrigConceptSummary[]>([])
  const [conceptId, setConceptId] = useState<string>('trig-101')
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    trigApi
      .concepts()
      .then((list) => {
        setConcepts(list)
        const firstUnlocked = list.find((c) => c.is_unlocked)
        if (firstUnlocked) setConceptId(firstUnlocked.id)
      })
      .catch(() => setError('Could not load the Trigonometry concept list.'))
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded) {
    return <div className="p-12 text-center text-[#8A8A7A] font-mono text-sm">Loading Trigonometry practice...</div>
  }

  if (error) {
    return (
      <div className="py-16 text-center bg-white rounded-[18px] border border-black/[0.06]">
        <p className="text-[14px] font-medium">{error}</p>
      </div>
    )
  }

  return <CoteacherWorkspace conceptId={conceptId} onSelectConcept={setConceptId} availableConcepts={concepts} />
}
