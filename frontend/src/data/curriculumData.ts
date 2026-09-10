export interface SimulationItem {
  id: string
  title: string
  equation: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  theme: string
  time: string
  points: number
  status: 'Solved ✓' | 'In Progress' | 'New' | 'No Simulation Added'
  chapterId: string
  subtopicId: string
  subjectId: string
  desc: string
  blockType: 'algebra-tile' | 'dataset' | 'projectile' | 'titration' | 'angles' | 'area-fraction'
  hasSimulation: boolean
  config?: any
}

export interface SubTopic {
  id: string
  title: string
  simCount: number
  simulations: SimulationItem[]
}

export interface Chapter {
  id: string
  title: string
  icon: string
  desc: string
  subtopics: SubTopic[]
}

export interface SubjectData {
  id: 'maths' | 'science' | 'social' | 'english'
  title: string
  icon: string
  accentColor: string
  description: string
  chapters: Chapter[]
}

export const CURRICULUM_DATABASE: Record<string, SubjectData> = {
  maths: {
    id: 'maths',
    title: 'Mathematics',
    icon: '📐',
    accentColor: '#d4ff3a',
    description: 'Master linear systems, quadratics, geometry, trigonometry, and statistics.',
    chapters: [
      {
        id: 'number-systems',
        title: 'Number Systems',
        icon: '🔢',
        desc: 'Real numbers, prime factorizations, fundamental theorem of arithmetic, and irrationality proofs.',
        subtopics: [
          {
            id: 'real-numbers',
            title: 'Real Numbers',
            simCount: 0,
            simulations: [
              {
                id: 'num-euclid',
                title: 'Euclid Division & Prime Factors',
                equation: 'a = b·q + r (0 ≤ r < b)',
                difficulty: 'Beginner',
                theme: 'Number Theory',
                time: '4 min',
                points: 60,
                status: 'No Simulation Added',
                chapterId: 'number-systems',
                subtopicId: 'real-numbers',
                subjectId: 'maths',
                desc: 'Explore stepwise factorization of large composite numbers using division algorithms.',
                blockType: 'area-fraction',
                hasSimulation: false
              }
            ]
          }
        ]
      },
      {
        id: 'algebra',
        title: 'Algebra',
        icon: '📐',
        desc: 'Polynomials, systems of linear equations, quadratic word problems, and arithmetic progressions.',
        subtopics: [
          {
            id: 'polynomials',
            title: 'Polynomials',
            simCount: 0,
            simulations: [
              {
                id: 'poly-zeroes',
                title: 'Geometric Zeroes of Quadratic Polynomial',
                equation: 'p(x) = x² - 4x + 3',
                difficulty: 'Beginner',
                theme: 'Algebraic Graphing',
                time: '5 min',
                points: 70,
                status: 'No Simulation Added',
                chapterId: 'algebra',
                subtopicId: 'polynomials',
                subjectId: 'maths',
                desc: 'Observe parabola x-intercepts and relate roots to coefficients alpha and beta.',
                blockType: 'algebra-tile',
                hasSimulation: false
              }
            ]
          },
          {
            id: 'linear-equations',
            title: 'Pair of Linear Equations',
            simCount: 0,
            simulations: [
              {
                id: 'lin-substitution',
                title: 'Linear Intersecting Lines',
                equation: '2x + y = 10,  x - y = 2',
                difficulty: 'Beginner',
                theme: 'Linear Algebra',
                time: '5 min',
                points: 75,
                status: 'No Simulation Added',
                chapterId: 'algebra',
                subtopicId: 'linear-equations',
                subjectId: 'maths',
                desc: 'Find unique solution coordinates using substitution and visual line intersection.',
                blockType: 'algebra-tile',
                hasSimulation: false
              }
            ]
          },
          {
            id: 'quadratic-equations',
            title: 'Quadratic Equations',
            simCount: 3,
            simulations: [
              {
                id: 'quad-park',
                title: 'Rectangular Park Area Problem',
                equation: '2x² + x - 528 = 0',
                difficulty: 'Beginner',
                theme: 'Geometry Area',
                time: '5 min',
                points: 75,
                status: 'Solved ✓',
                chapterId: 'algebra',
                subtopicId: 'quadratic-equations',
                subjectId: 'maths',
                desc: 'Solve for rectangular park dimensions where length is one more than twice breadth using tile models.',
                blockType: 'algebra-tile',
                hasSimulation: true
              },
              {
                id: 'quad-rocket',
                title: 'Rocket Trajectory & Max Height',
                equation: '-5t² + 20t + 25 = 0',
                difficulty: 'Intermediate',
                theme: 'Physics & Motion',
                time: '8 min',
                points: 90,
                status: 'New',
                chapterId: 'algebra',
                subtopicId: 'quadratic-equations',
                subjectId: 'maths',
                desc: 'Determine flight landing time and apex vertex of a model rocket projectile.',
                blockType: 'algebra-tile',
                hasSimulation: true
              },
              {
                id: 'quad-consecutive',
                title: 'Sum of Consecutive Squares',
                equation: 'x² + (x+1)² = 365',
                difficulty: 'Beginner',
                theme: 'Number Theory',
                time: '4 min',
                points: 65,
                status: 'New',
                chapterId: 'algebra',
                subtopicId: 'quadratic-equations',
                subjectId: 'maths',
                desc: 'Find two consecutive positive integers whose sum of squares equals 365.',
                blockType: 'algebra-tile',
                hasSimulation: true
              },
              {
                id: 'quad-ladder',
                title: 'Ladder & Wall Pythagorean Quadratic',
                equation: 'x² + (x+7)² = 13²',
                difficulty: 'Intermediate',
                theme: 'Geometry Area',
                time: '6 min',
                points: 85,
                status: 'No Simulation Added',
                chapterId: 'algebra',
                subtopicId: 'quadratic-equations',
                subjectId: 'maths',
                desc: 'Calculate right-triangle dimensions for a 13m leaning ladder using quadratic factorization.',
                blockType: 'algebra-tile',
                hasSimulation: false
              },
              {
                id: 'quad-swimming',
                title: 'Swimming Pool Concrete Deck Border',
                equation: '(20+2w)(10+2w) - 200 = 104',
                difficulty: 'Advanced',
                theme: 'Geometry Area',
                time: '12 min',
                points: 120,
                status: 'No Simulation Added',
                chapterId: 'algebra',
                subtopicId: 'quadratic-equations',
                subjectId: 'maths',
                desc: 'Find uniform walkway width surrounding a 20m x 10m pool with total deck area 104 m².',
                blockType: 'algebra-tile',
                hasSimulation: false
              }
            ]
          },
          {
            id: 'arithmetic-progressions',
            title: 'Arithmetic Progressions',
            simCount: 0,
            simulations: [
              {
                id: 'ap-sum',
                title: 'Sum of First n Terms of an AP',
                equation: 'Sₙ = n/2 · [2a + (n-1)d]',
                difficulty: 'Intermediate',
                theme: 'Sequence & Series',
                time: '6 min',
                points: 80,
                status: 'No Simulation Added',
                chapterId: 'algebra',
                subtopicId: 'arithmetic-progressions',
                subjectId: 'maths',
                desc: 'Visualize Gauss pairing method for sequence sums with interactive bar ladders.',
                blockType: 'dataset',
                hasSimulation: false
              }
            ]
          }
        ]
      },
      {
        id: 'coordinate-geometry',
        title: 'Coordinate Geometry',
        icon: '📍',
        desc: 'Distance formula, section formula, collinearity, and Cartesian geometry.',
        subtopics: [
          {
            id: 'coord-concepts',
            title: 'Concepts of Coordinate Geometry',
            simCount: 0,
            simulations: [
              {
                id: 'coord-distance',
                title: 'Distance Formula & Pythagorean Grid',
                equation: 'd = √[(x₂-x₁)² + (y₂-y₁)²]',
                difficulty: 'Beginner',
                theme: 'Coordinate Geometry',
                time: '5 min',
                points: 70,
                status: 'No Simulation Added',
                chapterId: 'coordinate-geometry',
                subtopicId: 'coord-concepts',
                subjectId: 'maths',
                desc: 'Calculate spatial distance between moving Cartesian coordinates interactively.',
                blockType: 'angles',
                hasSimulation: false
              }
            ]
          }
        ]
      },
      {
        id: 'geometry',
        title: 'Geometry',
        icon: '🔺',
        desc: 'Triangles, similarity criteria, basic proportionality, circles, and tangent angles.',
        subtopics: [
          {
            id: 'triangles',
            title: 'Triangles',
            simCount: 0,
            simulations: [
              {
                id: 'geom-pythagoras',
                title: 'Pythagorean Geometric Tile Proof',
                equation: 'a² + b² = c²',
                difficulty: 'Beginner',
                theme: 'Geometry Area',
                time: '5 min',
                points: 75,
                status: 'No Simulation Added',
                chapterId: 'geometry',
                subtopicId: 'triangles',
                subjectId: 'maths',
                desc: 'Rearrange square tiles on hypotenuse and legs to visually prove a² + b² = c².',
                blockType: 'algebra-tile',
                hasSimulation: false
              }
            ]
          },
          {
            id: 'circles',
            title: 'Circles & Central Angles',
            simCount: 1,
            simulations: [
              {
                id: 'geom-angles-point',
                title: 'Angles Around a Central Point',
                equation: '∠1 + ∠2 + ∠3 = 360°',
                difficulty: 'Beginner',
                theme: 'Geometry Angles',
                time: '4 min',
                points: 70,
                status: 'New',
                chapterId: 'geometry',
                subtopicId: 'circles',
                subjectId: 'maths',
                desc: 'Adjust pie sector angles around a single node to sum to a complete 360° turn.',
                blockType: 'angles',
                hasSimulation: true
              }
            ]
          }
        ]
      },
      {
        id: 'trigonometry',
        title: 'Trigonometry',
        icon: '📏',
        desc: 'Trigonometric ratios, standard angle values, pythagorean trig identities, and heights & distances.',
        subtopics: [
          {
            id: 'intro-trig',
            title: 'Introduction to Trigonometry',
            simCount: 0,
            simulations: [
              {
                id: 'trig-ratios',
                title: 'Right-Triangle Trigonometric Ratios',
                equation: 'sin(θ)=Opp/Hyp, cos(θ)=Adj/Hyp',
                difficulty: 'Beginner',
                theme: 'Trigonometry',
                time: '5 min',
                points: 75,
                status: 'No Simulation Added',
                chapterId: 'trigonometry',
                subtopicId: 'intro-trig',
                subjectId: 'maths',
                desc: 'Vary angle theta and observe real-time proportional scaling of side ratios.',
                blockType: 'angles',
                hasSimulation: false
              }
            ]
          },
          {
            id: 'trig-identities',
            title: 'Trigonometric Identities',
            simCount: 0,
            simulations: [
              {
                id: 'trig-circle-identity',
                title: 'Unit Circle Trig Proof: sin²θ + cos²θ = 1',
                equation: 'sin²(θ) + cos²(θ) = 1',
                difficulty: 'Intermediate',
                theme: 'Trigonometric Proof',
                time: '6 min',
                points: 85,
                status: 'No Simulation Added',
                chapterId: 'trigonometry',
                subtopicId: 'trig-identities',
                subjectId: 'maths',
                desc: 'Explore unit circle coordinates (cos θ, sin θ) and verify Pythagorean identity.',
                blockType: 'angles',
                hasSimulation: false
              }
            ]
          },
          {
            id: 'heights-distances',
            title: 'Heights and Distances',
            simCount: 0,
            simulations: [
              {
                id: 'trig-cliff-height',
                title: 'Angle of Elevation & Cliff Height',
                equation: 'tan(60°) = Height / 20m',
                difficulty: 'Intermediate',
                theme: 'Real-World Trig',
                time: '6 min',
                points: 90,
                status: 'No Simulation Added',
                chapterId: 'trigonometry',
                subtopicId: 'heights-distances',
                subjectId: 'maths',
                desc: 'Calculate lighthouse and cliff heights using line-of-sight elevation angles.',
                blockType: 'angles',
                hasSimulation: false
              }
            ]
          }
        ]
      },
      {
        id: 'mensuration',
        title: 'Mensuration',
        icon: '📦',
        desc: 'Areas of sectors, segments, combination of plane figures, and 3D surface areas & volumes.',
        subtopics: [
          {
            id: 'circle-areas',
            title: 'Areas Related to Circles',
            simCount: 1,
            simulations: [
              {
                id: 'mens-fraction-area',
                title: 'Fractional Area Shading Models',
                equation: 'Area Fraction = Numerator / Denominator',
                difficulty: 'Beginner',
                theme: 'Mensuration',
                time: '4 min',
                points: 65,
                status: 'New',
                chapterId: 'mensuration',
                subtopicId: 'circle-areas',
                subjectId: 'maths',
                desc: 'Adjust numerator and denominator sliders to observe fractional area coverage.',
                blockType: 'area-fraction',
                hasSimulation: true
              }
            ]
          },
          {
            id: 'surface-areas-volumes',
            title: 'Surface Areas and Volumes',
            simCount: 0,
            simulations: [
              {
                id: 'mens-cylinder-cone',
                title: 'Cylinder to Cone Volume Comparison',
                equation: 'V_cone = 1/3 · π·r²·h',
                difficulty: 'Intermediate',
                theme: '3D Geometry',
                time: '7 min',
                points: 85,
                status: 'No Simulation Added',
                chapterId: 'mensuration',
                subtopicId: 'surface-areas-volumes',
                subjectId: 'maths',
                desc: 'Observe the 3:1 volumetric ratio between cylinders and cones of equal base and height.',
                blockType: 'area-fraction',
                hasSimulation: false
              }
            ]
          }
        ]
      },
      {
        id: 'statistics-prob',
        title: 'Statistics and Probability',
        icon: '📊',
        desc: 'Mean, median, mode of grouped frequency distributions, and theoretical probability of outcomes.',
        subtopics: [
          {
            id: 'stats-mean',
            title: 'Mean, Median and Mode',
            simCount: 1,
            simulations: [
              {
                id: 'stats-data-points',
                title: 'Interactive Mean & Spread Analysis',
                equation: 'μ = (∑ xᵢ) / N = (4+8+6+5+12) / 5 = 7.0',
                difficulty: 'Beginner',
                theme: 'Statistics',
                time: '5 min',
                points: 75,
                status: 'New',
                chapterId: 'statistics-prob',
                subtopicId: 'stats-mean',
                subjectId: 'maths',
                desc: 'Manipulate numerical data points and observe immediate shifts in mean and central tendency.',
                blockType: 'dataset',
                hasSimulation: true
              }
            ]
          },
          {
            id: 'probability',
            title: 'Probability of an Event',
            simCount: 0,
            simulations: [
              {
                id: 'prob-dice-coins',
                title: 'Dice & Coin Frequency Simulator',
                equation: 'P(E) = n(E) / n(S)',
                difficulty: 'Beginner',
                theme: 'Probability',
                time: '4 min',
                points: 65,
                status: 'No Simulation Added',
                chapterId: 'statistics-prob',
                subtopicId: 'probability',
                subjectId: 'maths',
                desc: 'Run multi-trial coin and dice experiments to witness the Law of Large Numbers.',
                blockType: 'dataset',
                hasSimulation: false
              }
            ]
          }
        ]
      }
    ]
  },
  science: {
    id: 'science',
    title: 'Science',
    icon: '🔬',
    accentColor: '#38bdf8',
    description: 'Explore 2D physics kinematics, acid-base chemical equilibria, electricity, and biology.',
    chapters: [
      {
        id: 'physics',
        title: 'Physics & Motion',
        icon: '⚡',
        desc: 'Kinematics, 2D projectile range, light reflection & refraction, and electric circuits.',
        subtopics: [
          {
            id: 'projectile-motion',
            title: 'Projectile Motion & Kinematics',
            simCount: 1,
            simulations: [
              {
                id: 'phys-projectile-sim',
                title: '2D Launch Angle & Maximum Range',
                equation: 'R = (v² · sin(2θ)) / g',
                difficulty: 'Intermediate',
                theme: 'Physics & Motion',
                time: '6 min',
                points: 85,
                status: 'New',
                chapterId: 'physics',
                subtopicId: 'projectile-motion',
                subjectId: 'science',
                desc: 'Adjust launch angle from 0° to 90° with initial velocity 20m/s to find maximum range at 45°.',
                blockType: 'projectile',
                hasSimulation: true
              }
            ]
          }
        ]
      },
      {
        id: 'chemistry',
        title: 'Chemistry & Reactions',
        icon: '🧪',
        desc: 'Acids, bases, pH curves, titration equivalence, and chemical bonding.',
        subtopics: [
          {
            id: 'titration',
            title: 'Acids, Bases & Salts (Titration)',
            simCount: 1,
            simulations: [
              {
                id: 'chem-titration-sim',
                title: 'Strong Acid - Strong Base Titration',
                equation: 'HCl + NaOH → NaCl + H₂O (pH = 7.00)',
                difficulty: 'Intermediate',
                theme: 'Chemistry Equilibria',
                time: '7 min',
                points: 90,
                status: 'New',
                chapterId: 'chemistry',
                subtopicId: 'titration',
                subjectId: 'science',
                desc: 'Titrate 50mL 0.1M HCl with 0.1M NaOH and monitor the sharp pH transition near equivalence.',
                blockType: 'titration',
                hasSimulation: true
              }
            ]
          }
        ]
      }
    ]
  },
  social: {
    id: 'social',
    title: 'Social Studies',
    icon: '🌍',
    accentColor: '#fb923c',
    description: 'Investigate historical movements, geographic resource allocations, and democratic civics.',
    chapters: [
      {
        id: 'history',
        title: 'History & Civilizations',
        icon: '🏛️',
        desc: 'Nationalism in Europe and India, trade networks, and industrial manufacturing.',
        subtopics: [
          {
            id: 'nationalism-europe',
            title: 'Rise of Nationalism in Europe',
            simCount: 0,
            simulations: [
              {
                id: 'soc-trade-routes',
                title: 'Global Trade & Industrial Timelines',
                equation: 'Timeline: 1789 → 1848 → 1871',
                difficulty: 'Beginner',
                theme: 'History Interactive',
                time: '5 min',
                points: 70,
                status: 'No Simulation Added',
                chapterId: 'history',
                subtopicId: 'nationalism-europe',
                subjectId: 'social',
                desc: 'Explore key political milestones in 19th-century European nation-state unification.',
                blockType: 'dataset',
                hasSimulation: false
              }
            ]
          }
        ]
      }
    ]
  },
  english: {
    id: 'english',
    title: 'English',
    icon: '📚',
    accentColor: '#a78bfa',
    description: 'Develop reading comprehension, discursive analysis, grammar precision, and writing.',
    chapters: [
      {
        id: 'grammar',
        title: 'Grammar & Composition',
        icon: '✍️',
        desc: 'Tenses, modals, subject-verb concord, reported speech, and analytical paragraph writing.',
        subtopics: [
          {
            id: 'tenses-modals',
            title: 'Tenses & Verb Concord',
            simCount: 0,
            simulations: [
              {
                id: 'eng-tenses-matrix',
                title: 'Aspect & Tense Concord Matrix',
                equation: 'Subject + Auxiliary + Verb[Aspect]',
                difficulty: 'Beginner',
                theme: 'Grammar Precision',
                time: '5 min',
                points: 70,
                status: 'No Simulation Added',
                chapterId: 'grammar',
                subtopicId: 'tenses-modals',
                subjectId: 'english',
                desc: 'Interactive sentence tree model to master perfect and continuous aspect rules.',
                blockType: 'dataset',
                hasSimulation: false
              }
            ]
          }
        ]
      }
    ]
  }
}

export function getAllSimulations(): SimulationItem[] {
  const sims: SimulationItem[] = []
  Object.values(CURRICULUM_DATABASE).forEach((subj) => {
    subj.chapters.forEach((ch) => {
      ch.subtopics.forEach((st) => {
        st.simulations.forEach((s) => {
          sims.push(s)
        })
      })
    })
  })
  return sims
}

export function getSimulationById(id: string): SimulationItem | null {
  for (const subj of Object.values(CURRICULUM_DATABASE)) {
    for (const ch of subj.chapters) {
      for (const st of ch.subtopics) {
        for (const sim of st.simulations) {
          if (sim.id === id) return sim
        }
      }
    }
  }
  return null
}
