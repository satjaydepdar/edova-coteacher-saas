import { useEffect, useState } from 'react'
import CoteacherWorkspace from '../trig/CoteacherWorkspace'
import { coordgeoApi } from '../../lib/coordgeo/coordgeoApiClient'
import type { TrigConceptSummary } from '../../lib/trig/trigApiClient'

const COORDGEO_FORMULA_REFERENCE: [string, string][] = [
  ['Distance Formula', 'PQ = sqrt((x2-x1)^2 + (y2-y1)^2)'],
  ['Distance from Origin', 'OP = sqrt(x^2 + y^2)'],
  ['Section Formula', 'x=(m1x2+m2x1)/(m1+m2)'],
  ['Midpoint', 'M = ((x1+x2)/2, (y1+y2)/2)'],
  ['Collinearity', 'Collinear if AB + BC = AC'],
  ['Rhombus Area', 'Area = 1/2 * d1 * d2'],
]

const COORDGEO_PRESET_PROBLEMS = [
  { title: 'NCERT Distance Formula', text: 'Find the distance between A(2,3) and B(4,1).' },
  { title: 'NCERT Section Formula', text: 'Find the point P which divides the line segment joining A(1,-5) and B(-4,5) in the ratio 1:2.' },
  { title: 'Collinearity Check', text: 'Check if A(1,-1), B(5,2), C(9,5) are collinear.' },
  { title: 'Board Rhombus Area', text: 'Find the area of a rhombus whose vertices are (3,0),(4,5),(-1,4),(-2,-1), taken in order.' },
  { title: 'Parallelogram Vertex', text: 'If A(6,1), B(8,2), C(9,4), D(p,3) are vertices of a parallelogram ABCD, find p.' },
]

/** Mirrors TrigonometryPractice.tsx's role, rendering the same shared
 * CoteacherWorkspace with Coordinate Geometry's api client and content
 * instead of duplicating the whole interactive workspace. */
export default function CoordinateGeometryPractice() {
  const [concepts, setConcepts] = useState<TrigConceptSummary[]>([])
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

  return (
    <CoteacherWorkspace
      conceptId={conceptId}
      onSelectConcept={setConceptId}
      availableConcepts={concepts}
      api={coordgeoApi}
      telemetryEndpoint="/api/coordgeo/telemetry/event"
      dagSubjectLabel="CBSE CLASS 10 DAG"
      subjectFallbackName="Coordinate Geometry"
      formulaReferenceTitle="CBSE Coordinate Geometry Formulas Reference"
      formulaReferenceItems={COORDGEO_FORMULA_REFERENCE}
      customModalTitle="Custom CBSE Coordinate Geometry Problem"
      presetProblems={COORDGEO_PRESET_PROBLEMS}
      syncBadgeLabel="SYNC COORDINATE PLANE • LIVE"
    />
  )
}
