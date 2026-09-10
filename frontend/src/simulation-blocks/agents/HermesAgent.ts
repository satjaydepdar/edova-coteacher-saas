import { Pit } from '../types'

export type AskInput = {
  query: string
  blockState?: any
  blockType?: string
  chapterId?: string
  conceptId?: string
  masteredConceptIds?: string[]
  pits?: Pit[]
}

export type AskResponse = {
  text: string
  ui?: string
  matchedPitId?: string
  conceptId?: string
  isReady?: boolean
  missingPrerequisites?: string[]
  nextRecommendedConcept?: string
}

export class HermesAgent {
  async ask(input: AskInput): Promise<AskResponse> {
    const q = (input.query || '').toLowerCase().trim()
    const pits = input.pits || []
    const state = input.blockState || {}
    const blockType = input.blockType || 'algebra-tile'
    const conceptId = input.conceptId
    const mastered = new Set(input.masteredConceptIds || [])

    // =========================================================================
    // 1. Long-Term Concept Memory & Recall Engine
    // (Triggers when student asks about past sessions, earlier lessons, or previous learnings)
    // =========================================================================
    const isRecallQuery =
      q.includes('recall') ||
      q.includes('remind me') ||
      q.includes('earlier') ||
      q.includes('last time') ||
      q.includes('before') ||
      q.includes('previous session') ||
      q.includes('what did we learn') ||
      q.includes('what did i learn') ||
      q.includes('how did we solve') ||
      q.includes('past work') ||
      q.includes('remember')

    if (isRecallQuery) {
      if (q.includes('ap-05') || q.includes('common difference') || q.includes('difference') || q.includes('d =')) {
        return {
          text: "🧠 <b>Hermes Long-Term Memory Recall:</b><br>In your earlier practice on <b>Common Difference (AP-05)</b>, we discovered that when sequences decrease, <b>d must be negative</b> because you always subtract earlier from later (<span class='text-[#d4ff3a] font-mono'>a₂ − a₁</span>). For example, in 10, 7, 4... <span class='text-[#d4ff3a] font-mono'>d = 7 − 10 = -3</span>.<br><br>Would you like to apply that rule to this problem?",
          ui: 'highlight-diff',
          conceptId: 'AP-05',
          isReady: true
        }
      }
      if (q.includes('ap-03') || q.includes('definition of an ap') || q.includes('ap def')) {
        return {
          text: "🧠 <b>Hermes Long-Term Memory Recall:</b><br>In your earlier session on <b>Definition of an AP (AP-03)</b>, you verified that every consecutive pair in an Arithmetic Progression must have the <b>exact same fixed step size</b> (<span class='text-[#d4ff3a] font-mono'>aₖ₊₁ − aₖ = d</span>) throughout the entire list!",
          ui: 'none',
          conceptId: 'AP-03',
          isReady: true
        }
      }
      if (q.includes('ap-09') || q.includes('nth term') || q.includes('an formula')) {
        return {
          text: "🧠 <b>Hermes Long-Term Memory Recall:</b><br>In your previous work on <b>n-th Term (AP-09)</b>, you derived the formula <br><br><span class='font-mono bg-black/40 px-2 py-1 rounded text-[#d4ff3a]'>aₙ = a + (n − 1)d</span><br><br>Remembering that we multiply by <b>(n − 1)</b> because the initial term <i>a</i> didn't receive any added <i>d</i>'s!",
          ui: 'show-formula',
          conceptId: 'AP-09',
          isReady: true
        }
      }
      if (q.includes('ap-17') || q.includes('sum') || q.includes('sn')) {
        return {
          text: "🧠 <b>Hermes Long-Term Memory Recall:</b><br>In your previous session on <b>Sum of n Terms (AP-17)</b>, you solved sums using <br><br><span class='font-mono bg-black/40 px-2 py-1 rounded text-[#d4ff3a]'>Sₙ = (n/2)[2a + (n − 1)d]</span><br><br>and the shortcut <span class='text-[#d4ff3a] font-mono'>Sₙ = (n/2)(a + l)</span> when the final term (l) is known.",
          ui: 'show-sum',
          conceptId: 'AP-17',
          isReady: true
        }
      }
      if (q.includes('negat') || q.includes('root') || q.includes('dimension') || q.includes('quadratic') || q.includes('park')) {
        return {
          text: "🧠 <b>Hermes Long-Term Memory Recall:</b><br>In your earlier session on <b>Quadratic Dimensions</b>, you solved <span class='text-[#d4ff3a] font-mono'>2x² + x − 528 = 0</span> yielding roots <i>x = -16.5</i> and <i>x = 16</i>. You correctly realized physical dimensions cannot be negative, discarding -16.5 to keep <b>x = 16 m</b>.",
          ui: 'shake-negative-tile'
        }
      }
      if (q.includes('mean') || q.includes('outlier') || q.includes('median') || q.includes('stat')) {
        return {
          text: "🧠 <b>Hermes Long-Term Memory Recall:</b><br>In your previous work on <b>Central Tendency</b>, you proved that adding an extreme outlier pulls the <b>Mean</b> strongly toward it, whereas the <b>Median</b> remains resistant!",
          ui: 'none'
        }
      }
      if (q.includes('titrat') || q.includes('ph') || q.includes('acid') || q.includes('base')) {
        return {
          text: "🧠 <b>Hermes Long-Term Memory Recall:</b><br>In your earlier chemistry session on <b>Titrations</b>, you determined that neutral equivalence (pH = 7.00) between 0.1M HCl and 0.1M NaOH occurs at exactly <b>50 mL</b> titrant.",
          ui: 'none'
        }
      }
    }

    // =========================================================================
    // 2. Custom Pit Matching (Highest Priority for active errors)
    // =========================================================================
    for (const pit of pits) {
      if (pit.trigger) {
        const patterns = pit.trigger.split('|').map((p) => p.trim().toLowerCase()).filter(Boolean)
        const isMatched = patterns.some((p) => {
          if (p.includes(' ')) {
            const keywords = p.split(/\s+/).filter((w) => w.length > 2)
            return keywords.length > 0 && keywords.every((kw) => q.includes(kw))
          }
          return q.includes(p)
        })
        if (isMatched) {
          return { text: pit.response, ui: pit.ui || 'none', matchedPitId: pit.id }
        }
      }
    }

    // =========================================================================
    // 3. Specific Topic / Concept Question Routing
    // =========================================================================
    
    // A. Arithmetic Progressions (AP)
    if (
      q.includes('ap') ||
      q.includes('arithmetic progression') ||
      q.includes('step size') ||
      q.includes('consecutive pair') ||
      q.includes('common diff') ||
      q.includes('nth term') ||
      q.includes('first term') ||
      q.includes('general form') ||
      q.includes('sum of') ||
      conceptId?.startsWith('AP-')
    ) {
      if (q.includes('definition') || q.includes('ap-03') || q.includes('what is an ap') || q.includes('same step')) {
        return {
          text: "Yes! In an <b>Arithmetic Progression (AP)</b>, every single consecutive pair of terms must have the <b>exact same constant step size</b> called the <i>common difference (d)</i>: <br><br><span class='font-mono bg-black/40 px-2 py-1 rounded text-[#d4ff3a]'>aₖ₊₁ − aₖ = d</span><br><br>If the jump changes anywhere along the list, it is not an AP.",
          ui: 'none',
          conceptId: 'AP-03',
          isReady: true
        }
      }
      if (q.includes('pattern') || q.includes('ap-01') || q.includes('sequence')) {
        return {
          text: "A <b>sequence</b> is an ordered list of numbers following a clear mathematical rule (e.g. +3 each step, doubling, or squaring). In an AP, that rule is always <i>adding a constant number</i>.",
          ui: 'none',
          conceptId: 'AP-01',
          isReady: true
        }
      }
      if (q.includes('term') && (q.includes('position') || q.includes('rank') || q.includes('ap-02'))) {
        return {
          text: "Each number in a sequence has a position index: <b>a₁</b> is the 1st term, <b>a₂</b> is the 2nd term, up to <b>aₙ</b> for the n-th term. Notice that <b>n</b> is the rank/spot, while <b>aₙ</b> is the actual number sitting there!",
          ui: 'none',
          conceptId: 'AP-02',
          isReady: true
        }
      }
      if (q.includes('difference') || q.includes('backwards') || q.includes('sign') || q.includes('minus') || q.includes('ap-05')) {
        return {
          text: "Always calculate common difference as <b>a₂ − a₁</b> (later term minus earlier term). If numbers are decreasing (e.g., 10, 7, 4...), then <b>d is negative (-3)</b>!",
          ui: 'highlight-diff',
          conceptId: 'AP-05',
          isReady: true
        }
      }
      if (q.includes('formula') || q.includes('n-1') || q.includes('nth') || q.includes('general term') || q.includes('ap-09')) {
        return {
          text: "To find any term directly without writing out the whole list: <br><br><span class='font-mono bg-black/40 px-2 py-1 rounded text-[#d4ff3a]'>aₙ = a + (n − 1)d</span><br><br>We multiply by <b>(n − 1)</b> because the first term (a) didn't receive any added 'd'!",
          ui: 'show-formula',
          conceptId: 'AP-09',
          isReady: true
        }
      }
      if (q.includes('sum') || q.includes('total') || q.includes('sn') || q.includes('gauss') || q.includes('ap-17')) {
        return {
          text: "To sum the first n terms of an AP: <br><br><span class='font-mono bg-black/40 px-2 py-1 rounded text-[#d4ff3a]'>Sₙ = (n/2)[2a + (n − 1)d]</span><br><br>If you already know the last term (l), use the quick formula: <b>Sₙ = (n/2)(a + l)</b>!",
          ui: 'show-sum',
          conceptId: 'AP-17',
          isReady: true
        }
      }
      if (q.includes('mean') || q.includes('am') || q.includes('ap-23')) {
        return {
          text: "For any three terms in AP (a, b, c), the middle term is the <b>Arithmetic Mean</b>: <br><br><span class='font-mono bg-black/40 px-2 py-1 rounded text-[#d4ff3a]'>b = (a + c) / 2</span>",
          ui: 'none',
          conceptId: 'AP-23',
          isReady: true
        }
      }
    }

    // B. Fractions & Proportions
    if (q.includes('fraction') || q.includes('denominator') || q.includes('numerator') || q.includes('proportion')) {
      const num = state.numerator ?? 2
      const den = state.denominator ?? 2
      if (q.includes('denominator') || q.includes('bottom')) {
        return {
          text: `The <b>denominator</b> (${den}) represents the total number of equal parts the whole area is partitioned into.`,
          ui: 'none'
        }
      }
      if (q.includes('numerator') || q.includes('top')) {
        return {
          text: `The <b>numerator</b> (${num}) represents how many of those equal parts are currently shaded or selected.`,
          ui: 'none'
        }
      }
      if (q.includes('equal') || num === den || q.includes('whole') || q.includes('simplify')) {
        return {
          text: `When numerator equals denominator (${num}/${den}), it equals <b>1.000</b> (a 100% full whole area). Try changing the denominator to explore other fractions!`,
          ui: 'none'
        }
      }
      return {
        text: `Currently you have <b>${num}/${den}</b> (${(num / den).toFixed(3)}). Drag the numerator slider to change how many partitions are shaded!`,
        ui: 'none'
      }
    }

    // C. Projectiles & Launch Angles
    if (q.includes('launch') || q.includes('projectile') || q.includes('trajectory') || q.includes('range') || (q.includes('45') && q.includes('angle'))) {
      const angle = state.angle ?? 45
      if (q.includes('45') || q.includes('max') || q.includes('why')) {
        return {
          text: `In the horizontal range equation R = (v² · sin(2θ)) / g, sin(2θ) reaches its maximum value of <b>1.0</b> when 2θ = 90°, meaning <b>θ = 45° gives maximum range!</b>`,
          ui: 'none'
        }
      }
      if (q.includes('height')) {
        return {
          text: `Maximum height increases as angle increases up to 90° (vertical launch), because more initial velocity is directed vertically (v · sin θ).`,
          ui: 'none'
        }
      }
      return {
        text: `Current launch angle is <b>${angle}°</b>. Drag the slider to 45° to observe maximum range!`,
        ui: 'none'
      }
    }

    // D. Chemistry Titration
    if (q.includes('titrat') || q.includes('ph') || q.includes('naoh') || q.includes('acid') || q.includes('equivalence')) {
      const vol = state.titrantVol ?? 25
      if (q.includes('equivalence') || q.includes('neutral') || q.includes('7')) {
        return {
          text: `For a strong acid (0.1M HCl) titrated with strong base (0.1M NaOH), the equivalence point occurs at exactly <b>50 mL NaOH</b> where moles of H⁺ = moles of OH⁻, giving neutral <b>pH = 7.00</b>.`,
          ui: 'none'
        }
      }
      return {
        text: `Currently ${vol} mL NaOH added. Keep adding titrant towards 50 mL to watch the sharp pH equivalence jump!`,
        ui: 'none'
      }
    }

    // E. Angles & Geometry
    if (q.includes('360') || (q.includes('angle') && (q.includes('point') || q.includes('circle') || q.includes('around')))) {
      const a1 = state.angle1 ?? 120
      const a2 = state.angle2 ?? 150
      const a3 = 360 - a1 - a2
      return {
        text: `A full rotation around a central vertex forms a complete circle (<b>360°</b>). With Angle 1 = ${a1}° and Angle 2 = ${a2}°, the remaining Angle 3 must be <b>360° − (${a1}° + ${a2}°) = ${a3}°</b>.`,
        ui: 'none'
      }
    }

    // F. Statistics, Mean, Outliers
    if (q.includes('mean') || q.includes('median') || q.includes('outlier') || q.includes('average') || q.includes('central tendency')) {
      if (q.includes('outlier')) {
        return {
          text: "An <b>outlier</b> is an extreme value that is far higher or lower than the rest. Adding an outlier pulls the <b>Mean</b> heavily in its direction, whereas the <b>Median</b> remains resistant!",
          ui: 'none'
        }
      }
      if (q.includes('median')) {
        return {
          text: "The <b>Mean</b> is the arithmetic average (Sum / Count). The <b>Median</b> is the middle value when all numbers are sorted from smallest to largest.",
          ui: 'none'
        }
      }
      return {
        text: "The <b>Mean</b> is calculated by adding all data points together and dividing by the total count: <br><br><span class='font-mono bg-black/40 px-2 py-1 rounded text-[#d4ff3a]'>Mean (μ) = (∑ xᵢ) / N</span>",
        ui: 'none'
      }
    }

    // G. Quadratic Equations & Algebra Tiles
    if (q.includes('negat') || q.includes('reject') || q.includes('discard') || q.includes('root') || q.includes('-16.5') || q.includes('-33/2') || q.includes('minus')) {
      return {
        text: "Great question! When solving the quadratic equation 2x² + x − 528 = 0, algebra gives two mathematical roots: <i>x = 16</i> and <i>x = -16.5 (-33/2)</i>.<br><br>However, <b>x represents the physical breadth of a real park</b>. In physical geometry, a width or distance cannot be negative! Therefore, we discard x = -16.5 and accept <b>x = 16 m</b> as the only valid real-world solution.",
        ui: 'shake-negative-tile'
      }
    }

    if (q.includes('why is this the answer') || q.includes('why this answer')) {
      return {
        text: "At Breadth <b>x = 16 m</b>, Length is 2(16) + 1 = 33 m. Multiplying them gives exact Area = 16 × 33 = <b>528 m²</b>, which matches the park's required target area perfectly!",
        ui: 'none'
      }
    }

    if (q.includes('equa') || q.includes('form') || q.includes('formula') || q.includes('breadth') || q.includes('length')) {
      return {
        text: "Let's break the word problem down into step-by-step algebraic formulation:<br><br>" +
          "<b>1. Assign the Variable</b>:<br>" +
          "&nbsp;&nbsp;Let Breadth = <b>x</b>.<br><br>" +
          "<b>2. Translate Word Clues to Length</b>:<br>" +
          "&nbsp;&nbsp;• 'Twice its breadth' = <b>2x</b><br>" +
          "&nbsp;&nbsp;• 'One more than twice its breadth' gives <b>Length = 2x + 1</b>.<br><br>" +
          "<b>3. Formulate the Area Equation</b>:<br>" +
          "&nbsp;&nbsp;Since Area = Breadth × Length = 528 m²:<br>" +
          "&nbsp;&nbsp;<span class='font-mono bg-black/40 px-2.5 py-1 rounded-lg text-zinc-200 inline-block'>x · (2x + 1) = 528</span><br><br>" +
          "<b>4. Expand using Distributive Property</b>:<br>" +
          "&nbsp;&nbsp;Multiply x across (2x + 1):<br>" +
          "&nbsp;&nbsp;• x · 2x = <b>2x²</b><br>" +
          "&nbsp;&nbsp;• x · 1 = <b>+1x</b><br>" +
          "&nbsp;&nbsp;→ <span class='font-mono bg-black/40 px-2.5 py-1 rounded-lg text-zinc-200 inline-block'>2x² + x = 528</span><br><br>" +
          "<b>5. Rearrange to Standard Quadratic Form</b>:<br>" +
          "&nbsp;&nbsp;Subtract 528 from both sides to set the equation to zero:<br>" +
          "&nbsp;&nbsp;<span class='font-mono bg-black/40 px-2.5 py-1 rounded-lg text-[#d4ff3a] inline-block font-bold'>2x² + x − 528 = 0</span><br><br>" +
          "📌 <b>Conclusion</b>: The equation is now in the <b>Standard Quadratic Form</b> <span class='text-[#d4ff3a] font-mono'>ax² + bx + c = 0</span>, where <b>a = 2</b>, <b>b = 1</b>, and <b>c = -528</b>!",
        ui: 'highlight-tiles'
      }
    }

    if (q.includes('ac method') || q.includes('what is ac') || q.includes('how does ac') || q.includes('why ac') || (q.includes('middle') && q.includes('split'))) {
      return {
        text: "The <b>AC Method</b> is a systematic algebraic method to factor quadratic trinomials <span class='text-[#d4ff3a] font-mono'>ax² + bx + c = 0</span>:<br><br>" +
          "<b>1. Multiply 'a' and 'c'</b>: Here, <span class='font-mono'>a = 2</span> and <span class='font-mono'>c = -528</span>, so <span class='text-[#d4ff3a] font-mono'>a · c = 2 × (-528) = -1056</span>.<br>" +
          "<b>2. Find Two Numbers (p, q)</b> that satisfy TWO rules simultaneously:<br>" +
          "&nbsp;&nbsp;• <b>Product</b>: <span class='font-mono'>p · q = a·c = -1056</span><br>" +
          "&nbsp;&nbsp;• <b>Sum</b>: <span class='font-mono'>p + q = b = +1</span> (the middle coefficient)<br>" +
          "&nbsp;&nbsp;→ Our factors are <b>+33</b> and <b>-32</b> because <span class='font-mono'>(+33) × (-32) = -1056</span> and <span class='font-mono'>33 + (-32) = +1</span>.<br>" +
          "<b>3. Split the Middle Term</b>: Rewrite <span class='font-mono'>+1x</span> as <span class='font-mono'>+33x − 32x</span>:<br>" +
          "&nbsp;&nbsp;<span class='font-mono bg-black/40 px-2 py-1 rounded text-[#d4ff3a]'>2x² + 33x − 32x − 528 = 0</span><br>" +
          "<b>4. Factor by Grouping</b>:<br>" +
          "&nbsp;&nbsp;<span class='font-mono'>x(2x + 33) − 16(2x + 33) = (2x + 33)(x − 16) = 0</span>.",
        ui: 'show-factorization',
        conceptId: 'QUAD-02'
      }
    }

    if (q.includes('letter') || q.includes('stand for') || q.includes('mean') || q.includes('what is t') || q.includes('what is h')) {
      return {
        text: "Here is what each letter represents in the rocket trajectory formula:<br><br>" +
          "• <b>t</b> = <b>Flight Time</b> in seconds elapsed since launch.<br>" +
          "• <b>h(t)</b> = <b>Height</b> of the rocket above the ground in meters.<br>" +
          "• <b>-5t²</b> = Gravitational deceleration pulling the rocket downward.<br>" +
          "• <b>+20t</b> = Initial launch velocity upward (20 m/s).<br>" +
          "• <b>+25</b> = Starting launch pad elevation (25 m above ground).<br><br>" +
          "👉 When the rocket impacts the ground, height is <span class='text-[#d4ff3a] font-mono'>h(t) = 0 m</span>!",
        ui: 'none'
      }
    }

    if (q.includes('landing') || (q.includes('rocket') && q.includes('5')) || (q.includes('ground') && q.includes('impact'))) {
      return {
        text: "When the rocket hits the ground, its height is zero: <span class='text-[#d4ff3a] font-mono'>h(t) = 0 m</span>.<br><br>" +
          "Plugging in <span class='font-mono'>t = 5 seconds</span>:<br>" +
          "<span class='font-mono bg-black/40 px-2.5 py-1 rounded-lg text-[#d4ff3a] inline-block'>h(5) = -5(5)² + 20(5) + 25 = -125 + 100 + 25 = 0 m</span> ✓<br><br>" +
          "Therefore, the rocket stays in the air for <b>5 seconds</b> before landing!",
        ui: 'none'
      }
    }

    if (q.includes('apex') || q.includes('max height') || q.includes('vertex')) {
      return {
        text: "For the parabola <span class='font-mono'>h(t) = -5t² + 20t + 25</span>, the vertex occurs at time <span class='font-mono'>t = -b / (2a) = -20 / (2 × -5) = 2 seconds</span>.<br><br>" +
          "Plugging in <span class='font-mono'>t = 2 s</span> gives maximum apex height:<br>" +
          "<span class='font-mono bg-black/40 px-2.5 py-1 rounded-lg text-[#d4ff3a] inline-block'>h(2) = -5(2)² + 20(2) + 25 = -20 + 40 + 25 = 45 meters</span>!",
        ui: 'none'
      }
    }

    if (q.includes('factor') || q.includes('split') || q.includes('solve') || q.includes('middle')) {
      return {
        text: "For 2x² + x − 528 = 0, find two numbers with product 2×(-528) = -1056 and sum +1 → <b>33</b> and <b>-32</b>.<br><br><span class='font-mono bg-black/40 px-2.5 py-1 rounded-lg text-[#d4ff3a] inline-block'>2x² + 33x − 32x − 528 = 0 → (2x + 33)(x − 16) = 0</span>",
        ui: 'show-factorization'
      }
    }

    // 4. Fallback to active simulation workspace context if query is generic
    if (blockType === 'dataset') {
      return {
        text: "You're exploring Central Tendency! Click the buttons on the right to add numbers, or ask me how outliers affect the mean and median.",
        ui: 'none'
      }
    }
    if (blockType === 'area-fraction') {
      return {
        text: "Try dragging the numerator and denominator sliders on the right to see how fractional areas change!",
        ui: 'none'
      }
    }

    return {
      text: "I am actively watching your work in the simulation workspace! Try adjusting the controls on the right, or ask me any question about the steps.",
      ui: 'none'
    }
  }
}
