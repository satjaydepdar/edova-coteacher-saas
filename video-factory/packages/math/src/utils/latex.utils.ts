/**
 * LaTeX utility functions for math video generation
 */

export function latexFrac(numerator: string | number, denominator: string | number): string {
  return `\\frac{${numerator}}{${denominator}}`;
}

export function latexSqrt(content: string | number): string {
  return `\\sqrt{${content}}`;
}

export function latexPow(base: string | number, exp: string | number): string {
  return `{${base}}^{${exp}}`;
}

export function formatAlignedEquation(equations: Array<{ left: string; right: string; annotation?: string }>): string {
  const lines = equations.map(eq => {
    const ann = eq.annotation ? `\\quad \\text{(${eq.annotation})}` : '';
    return `${eq.left} &= ${eq.right}${ann}`;
  });
  return `\\begin{aligned}\n${lines.join(' \\\\\n')}\n\\end{aligned}`;
}

export function highlightLatexTerm(latex: string, term: string, color = '#f59e0b'): string {
  return latex.replaceAll(term, `\\mathbf{\\color{${color}}{${term}}}`);
}
