export const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
export const hcf = (ns: number[]): number => ns.reduce(gcd);
export const lcm = (ns: number[]): number => ns.reduce((a, b) => (a * b) / gcd(a, b));
export const factorize = (n: number): number[] => {
  const f: number[] = [];
  for (let d = 2; n > 1; d++) while (n % d === 0) { f.push(d); n /= d; }
  return f;
};
export const divisors = (n: number): number[] => {
  const d: number[] = [];
  for (let i = 1; i <= n; i++) if (n % i === 0) d.push(i);
  return d;
};
export const commonDivisors = (ns: number[]): number[] =>
  divisors(ns[0]).filter((d) => ns.every((n) => n % d === 0));
/** e.g. [60,84,108] -> [2,2,3] (common primes with lowest exponents) */
export function commonPrimePowers(ns: number[]): number[] {
  const fs = ns.map(factorize);
  const primes = [...new Set(fs.flat())];
  const out: number[] = [];
  for (const p of primes) {
    const min = Math.min(...fs.map((f) => f.filter((x) => x === p).length));
    for (let i = 0; i < min; i++) out.push(p);
  }
  return out;
}
