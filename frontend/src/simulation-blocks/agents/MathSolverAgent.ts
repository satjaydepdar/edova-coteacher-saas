export interface MathStep {
  stepNumber: number
  title: string
  formula?: string
  explanation: string
  subCalculation?: string
}

export interface QuadraticSolution {
  a: number
  b: number
  c: number
  targetArea?: number
  discriminant: number
  factorPair: [number, number] | null
  factoredForm: string
  roots: number[]
  validRoot: number
  steps: MathStep[]
}

export class MathSolverAgent {
  /**
   * Solves any standard quadratic equation ax² + bx + c = 0 and generates pedagogical steps
   */
  public solveQuadratic(a: number, b: number, c: number, targetArea?: number): QuadraticSolution {
    const ac = a * c
    const discriminant = b * b - 4 * a * c

    // 1. Search for middle-term AC split factor pair
    const factorPair = this.findFactorPair(ac, b)

    // 2. Compute exact roots via quadratic formula
    let roots: number[] = []
    if (discriminant >= 0) {
      const sqrtD = Math.sqrt(discriminant)
      const r1 = (-b + sqrtD) / (2 * a)
      const r2 = (-b - sqrtD) / (2 * a)
      roots = [parseFloat(r1.toFixed(2)), parseFloat(r2.toFixed(2))]
    }

    const validRoot = roots.find((r) => r > 0) ?? (roots.length > 0 ? roots[0] : 0)

    // 3. Compute grouping binomials (px + q)(rx + s) = 0
    let factoredForm = `(${a}x + ${b}) = 0`
    if (factorPair) {
      const [f1, f2] = factorPair
      const g1 = this.gcd(Math.abs(a), Math.abs(f1))
      const p = a / g1
      const q = f1 / g1
      const r = g1
      const s = f2 / p
      const signQ = q >= 0 ? `+ ${q}` : `- ${Math.abs(q)}`
      const signS = s >= 0 ? `+ ${s}` : `- ${Math.abs(s)}`
      factoredForm = `(${p}x ${signQ})(${r === 1 ? 'x' : `${r}x`} ${signS}) = 0`
    }

    // 4. Generate structured 5-step derivation
    const signB = b >= 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`
    const signC = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`
    const standardEq = `${a === 1 ? 'x²' : `${a}x²`} ${b !== 0 ? signB : ''} ${signC} = 0`

    const steps: MathStep[] = [
      {
        stepNumber: 1,
        title: 'Problem Formulation',
        formula: targetArea ? `Area = Length × Breadth = x(2x + 1) = ${targetArea}` : standardEq,
        explanation: targetArea
          ? `Let breadth = x. Length is one more than twice the breadth: 2x + 1. Area = ${targetArea} m².`
          : `Given the quadratic expression with coefficients a = ${a}, b = ${b}, and c = ${c}.`
      },
      {
        stepNumber: 2,
        title: 'Standard Quadratic Form (ax² + bx + c = 0)',
        formula: standardEq,
        explanation: `Here, a = ${a}, b = ${b}, and c = ${c}. The AC product is a·c = ${a} × (${c}) = ${ac}.`
      },
      {
        stepNumber: 3,
        title: 'Splitting the Middle Term (AC Method)',
        formula: factorPair
          ? `${a}x² ${factorPair[0] >= 0 ? `+ ${factorPair[0]}x` : `- ${Math.abs(factorPair[0])}x`} ${
              factorPair[1] >= 0 ? `+ ${factorPair[1]}x` : `- ${Math.abs(factorPair[1])}x`
            } ${signC} = 0`
          : `Discriminant D = ${discriminant}`,
        explanation: factorPair
          ? `We need two numbers that multiply to ${ac} and add to ${b}. The factor pair is ${factorPair[0]} and ${factorPair[1]}.`
          : `Using the quadratic formula discriminant D = b² - 4ac = ${discriminant}.`
      },
      {
        stepNumber: 4,
        title: 'Factor by Grouping',
        formula: factoredForm,
        explanation: `Factoring common terms by grouping yields the product of linear factors equal to zero.`
      },
      {
        stepNumber: 5,
        title: 'Roots Extraction & Physical Validation',
        formula: `x = ${roots.join(', ')}`,
        explanation: `Solving for x gives roots ${roots.join(
          ' and '
        )}. Discarding non-physical negative values, the valid solution is x = ${validRoot} m.`
      }
    ]

    return {
      a,
      b,
      c,
      targetArea,
      discriminant,
      factorPair,
      factoredForm,
      roots,
      validRoot,
      steps
    }
  }

  /**
   * Generates a new clean integer-solvable quadratic word problem
   */
  public generateWordProblem(): { breadth: number; length: number; area: number; target: number } {
    const candidateBreadths = [10, 12, 14, 16, 18, 20]
    const chosenB = candidateBreadths[Math.floor(Math.random() * candidateBreadths.length)]
    const chosenL = 2 * chosenB + 1
    const area = chosenB * chosenL
    return {
      breadth: chosenB,
      length: chosenL,
      area,
      target: area
    }
  }

  private findFactorPair(product: number, sum: number): [number, number] | null {
    const limit = Math.floor(Math.sqrt(Math.abs(product))) + Math.abs(sum) + 50
    for (let i = -limit; i <= limit; i++) {
      if (i === 0) continue
      if (product % i === 0) {
        const j = product / i
        if (i + j === sum) {
          return [Math.max(i, j), Math.min(i, j)]
        }
      }
    }
    return null
  }

  private gcd(a: number, b: number): number {
    let x = Math.abs(a)
    let y = Math.abs(b)
    while (y) {
      const t = y
      y = x % y
      x = t
    }
    return x || 1
  }
}
