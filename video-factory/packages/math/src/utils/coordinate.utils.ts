export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  padding?: number;
}

export function mathToSvgCoords(
  x: number,
  y: number,
  bounds: ViewportBounds
): { svgX: number; svgY: number } {
  const pad = bounds.padding ?? 40;
  const drawWidth = bounds.width - pad * 2;
  const drawHeight = bounds.height - pad * 2;

  const rangeX = bounds.maxX - bounds.minX;
  const rangeY = bounds.maxY - bounds.minY;

  const normX = (x - bounds.minX) / (rangeX || 1);
  const normY = (y - bounds.minY) / (rangeY || 1);

  const svgX = pad + normX * drawWidth;
  // Invert Y because SVG coordinates increase downwards
  const svgY = bounds.height - pad - normY * drawHeight;

  return { svgX, svgY };
}

export function distance2D(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function midpoint2D(x1: number, y1: number, x2: number, y2: number): { x: number; y: number } {
  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2
  };
}
