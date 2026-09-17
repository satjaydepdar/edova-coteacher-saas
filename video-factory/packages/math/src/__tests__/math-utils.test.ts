import { describe, it, expect } from "vitest";
import { hcf, factorize, commonDivisors, commonPrimePowers, lcm } from "../lib/math-utils";

describe("golden numbers — HCF case study", () => {
  it("hcf(60,84,108) = 12", () => expect(hcf([60, 84, 108])).toBe(12));
  it("factorize(108) = [2,2,3,3,3]", () => expect(factorize(108)).toEqual([2, 2, 3, 3, 3]));
  it("common divisors = [1,2,3,4,6,12]", () => expect(commonDivisors([60, 84, 108])).toEqual([1, 2, 3, 4, 6, 12]));
  it("common prime powers = [2,2,3]", () => expect(commonPrimePowers([60, 84, 108])).toEqual([2, 2, 3]));
  it("lcm sanity", () => expect(lcm([4, 6])).toBe(12));
});
