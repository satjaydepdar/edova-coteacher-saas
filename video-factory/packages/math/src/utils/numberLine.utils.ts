export interface NumberLineTick {
  value: number;
  label: string;
  xPosition: number;
}

export function generateNumberLineTicks(
  min: number,
  max: number,
  step = 1,
  containerWidth = 800
): NumberLineTick[] {
  const ticks: NumberLineTick[] = [];
  const range = max - min;
  if (range <= 0) return ticks;

  for (let val = min; val <= max; val += step) {
    const xPosition = ((val - min) / range) * containerWidth;
    ticks.push({
      value: val,
      label: val.toString(),
      xPosition
    });
  }

  return ticks;
}

export function valueToNumberLineOffset(
  value: number,
  min: number,
  max: number,
  containerWidth: number
): number {
  const range = max - min;
  if (range <= 0) return 0;
  const clamped = Math.max(min, Math.min(max, value));
  return ((clamped - min) / range) * containerWidth;
}
