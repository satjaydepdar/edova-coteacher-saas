import { useEffect, useState } from 'react'
import CoordGeoWorkspace from './CoordGeoWorkspace'
import { coordgeoApi, type CoordGeoConceptSummary } from '../../lib/coordgeo/coordgeoApiClient'

/** Mirrors TrigonometryPractice.tsx's role: loads the 12-concept DAG, picks a
 * starting concept, and renders the workspace. */
export default function CoordinateGeometryPractice() {
  const [concepts, setConcepts] = useState<CoordGeoConceptSummary[]>([])
  const [conceptId, setConceptId] = useState<string>('coordgeo-c1')
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    coordgeoApi
      .concepts()
      .then((list) => {
        setConcepts(list)
        const firstUnlocked = list.find((c) => c.is_unlocked)
        if (firstUnlocked) setConceptId(firstUnlocked.id)
      })
      .catch(() => setError('Could not load the Coordinate Geometry concept list.'))
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded) {
    return <div className="p-12 text-center text-[#8A8A7A] font-mono text-sm">Loading Coordinate Geometry practice...</div>
  }

  if (error) {
    return (
      <div className="py-16 text-center bg-white rounded-[18px] border border-black/[0.06]">
        <p className="text-[14px] font-medium">{error}</p>
      </div>
    )
  }

  return <CoordGeoWorkspace conceptId={conceptId} onSelectConcept={setConceptId} availableConcepts={concepts} />
}
