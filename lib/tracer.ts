/**
 * Browser-based image tracer: Canvas pixel read → binary threshold →
 * flood-fill connected components → outer contour + hole extraction →
 * Douglas–Peucker simplification → SVG path string.
 *
 * Key improvements over basic edge-tracing:
 * 1. Holes (inner voids) are preserved via evenodd fill-rule
 * 2. Every connected component is traced separately
 * 3. Higher resolution cap (1200px) to retain fine detail
 */

export interface TraceResult {
  svg: string;
  width: number;
  height: number;
  pathCount: number;
}

export interface TracerOptions {
  threshold: number;
  turdSize: number;
  curveOptimization: number;
  color: string;
  background: string;
}

const DEFAULT_TRACER_OPTIONS: TracerOptions = {
  threshold: 128,
  turdSize: 0,
  curveOptimization: 1.0,
  color: "#0d0d0d",
  background: "transparent",
};

function getPixelLuminance(data: Uint8ClampedArray, i: number): number {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  if (a < 10) return 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function buildBinaryMask(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  threshold: number
): boolean[][] {
  const mask: boolean[][] = Array.from({ length: h }, () => Array(w).fill(false));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      mask[y][x] = getPixelLuminance(data, idx) < threshold;
    }
  }
  return mask;
}

/* ========================================================================
   Flood-fill connected components + outer/hole contour extraction
   ======================================================================== */

interface Point { x: number; y: number }

function floodFillComponent(
  mask: boolean[][],
  visited: boolean[][],
  startX: number,
  startY: number,
  w: number,
  h: number
): Set<string> {
  const pixels = new Set<string>();
  const stack: Point[] = [{ x: startX, y: startY }];

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    if (!mask[y][x] || visited[y][x]) continue;

    visited[y][x] = true;
    pixels.add(`${x},${y}`);

    stack.push({ x: x + 1, y });
    stack.push({ x: x - 1, y });
    stack.push({ x, y: y + 1 });
    stack.push({ x, y: y - 1 });
  }

  return pixels;
}

function getBoundingBox(pixels: Set<string>): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const key of pixels) {
    const [x, y] = key.split(',').map(Number);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY };
}

function traceEdgeContour(
  edgePixels: Set<string>,
  w: number,
  h: number
): Point[] {
  if (edgePixels.size === 0) return [];

  const first = Array.from(edgePixels)[0];
  const [sx, sy] = first.split(',').map(Number);

  const contour: Point[] = [];
  const dirs = [
    { dx: 1, dy: 0 }, { dx: 0, dy: 1 },
    { dx: -1, dy: 0 }, { dx: 0, dy: -1 },
  ];

  let cx = sx, cy = sy, dir = 0;
  const seen = new Set<string>();
  const maxIter = edgePixels.size * 4;
  let iter = 0;

  do {
    const key = `${cx},${cy}`;
    if (seen.has(key)) break;
    seen.add(key);
    contour.push({ x: cx, y: cy });

    let found = false;
    for (let i = 0; i < 4; i++) {
      const nd = (dir + 3 + i) % 4; // prefer left-turn (clockwise walk)
      const nx = cx + dirs[nd].dx;
      const ny = cy + dirs[nd].dy;
      const nk = `${nx},${ny}`;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && edgePixels.has(nk) && !seen.has(nk)) {
        cx = nx; cy = ny; dir = nd; found = true; break;
      }
    }
    if (!found) break;
  } while ((cx !== sx || cy !== sy) && ++iter < maxIter);

  return contour;
}

function extractOuterContour(
  pixels: Set<string>,
  w: number,
  h: number
): Point[] {
  const edge = new Set<string>();
  for (const key of pixels) {
    const [x, y] = key.split(',').map(Number);
    let onEdge = false;
    for (let dy = -1; dy <= 1 && !onEdge; dy++) {
      for (let dx = -1; dx <= 1 && !onEdge; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h || !pixels.has(`${nx},${ny}`)) {
          onEdge = true;
        }
      }
    }
    if (onEdge) edge.add(key);
  }
  return traceEdgeContour(edge, w, h);
}

function findHoles(
  fgPixels: Set<string>,
  mask: boolean[][],
  w: number,
  h: number,
  turdSize: number
): Point[][] {
  const { minX, minY, maxX, maxY } = getBoundingBox(fgPixels);
  const visitedBg = new Set<string>();
  const holes: Point[][] = [];

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const key = `${x},${y}`;
      if (fgPixels.has(key) || visitedBg.has(key)) continue;

      // Flood-fill a background region inside the bounding box
      const bgRegion = new Set<string>();
      const stack: Point[] = [{ x, y }];
      let touchesOutside = false;

      while (stack.length > 0) {
        const { x: cx, y: cy } = stack.pop()!;
        if (cx < minX || cx > maxX || cy < minY || cy > maxY) {
          touchesOutside = true;
          continue;
        }
        const ck = `${cx},${cy}`;
        if (fgPixels.has(ck) || visitedBg.has(ck)) continue;

        visitedBg.add(ck);
        bgRegion.add(ck);

        stack.push({ x: cx + 1, y: cy });
        stack.push({ x: cx - 1, y: cy });
        stack.push({ x: cx, y: cy + 1 });
        stack.push({ x: cx, y: cy - 1 });
      }

      // A hole is a background region that does NOT touch the outside of the component
      if (!touchesOutside && bgRegion.size >= turdSize) {
        // Build edge of the hole (bg pixels adjacent to fg)
        const edge = new Set<string>();
        for (const hk of bgRegion) {
          const [hx, hy] = hk.split(',').map(Number);
          let onEdge = false;
          for (let dy = -1; dy <= 1 && !onEdge; dy++) {
            for (let dx = -1; dx <= 1 && !onEdge; dx++) {
              if (dx === 0 && dy === 0) continue;
              if (fgPixels.has(`${hx + dx},${hy + dy}`)) onEdge = true;
            }
          }
          if (onEdge) edge.add(hk);
        }
        const holeContour = traceEdgeContour(edge, w, h);
        if (holeContour.length >= turdSize) {
          holes.push(holeContour);
        }
      }
    }
  }

  return holes;
}

function extractContours(
  mask: boolean[][],
  turdSize: number
): Array<{ outer: Point[]; holes: Point[][] }> {
  const h = mask.length;
  const w = mask[0]?.length || 0;
  const visited = Array.from({ length: h }, () => Array(w).fill(false));
  const results: Array<{ outer: Point[]; holes: Point[][] }> = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y][x] || visited[y][x]) continue;

      const pixels = floodFillComponent(mask, visited, x, y, w, h);
      if (pixels.size < Math.max(1, turdSize)) continue;

      const outer = extractOuterContour(pixels, w, h);
      if (outer.length < Math.max(1, turdSize)) continue;

      const holes = findHoles(pixels, mask, w, h, Math.max(1, turdSize));
      results.push({ outer, holes });
    }
  }

  return results;
}

/* ========================================================================
   Douglas–Peucker + path builders
   ======================================================================== */

function douglasPeucker(
  points: Point[],
  tolerance: number
): Point[] {
  if (points.length <= 2) return points;

  const stack: Array<[number, number]> = [[0, points.length - 1]];
  const keep = new Set<number>([0, points.length - 1]);

  while (stack.length) {
    const [start, end] = stack.pop()!;
    if (end <= start + 1) continue;

    const sx = points[start].x, sy = points[start].y;
    const ex = points[end].x, ey = points[end].y;
    const dx = ex - sx, dy = ey - sy;
    const segLen = Math.sqrt(dx * dx + dy * dy) || 1;

    let maxDist = -1, maxIdx = -1;
    for (let i = start + 1; i < end; i++) {
      const dist = Math.abs(dy * points[i].x - dx * points[i].y + ex * sy - ey * sx) / segLen;
      if (dist > maxDist) { maxDist = dist; maxIdx = i; }
    }

    if (maxDist > tolerance) {
      keep.add(maxIdx);
      stack.push([start, maxIdx]);
      stack.push([maxIdx, end]);
    }
  }

  return Array.from(keep).sort((a, b) => a - b).map((i) => points[i]);
}

function pointsToPath(points: Point[]): string {
  if (points.length < 2) return "";
  const closed = Math.hypot(points[0].x - points[points.length - 1].x,
                            points[0].y - points[points.length - 1].y) < 2;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
  }
  if (closed) d += " Z";
  return d;
}

function componentToPath(component: { outer: Point[]; holes: Point[][] }): string {
  let d = pointsToPath(component.outer);
  for (const hole of component.holes) {
    const h = pointsToPath(hole);
    if (h) d += " " + h;
  }
  return d;
}

/* ========================================================================
   Public API
   ======================================================================== */

export async function traceImage(
  imageSrc: string,
  opts: Partial<TracerOptions> = {}
): Promise<TraceResult> {
  const options = { ...DEFAULT_TRACER_OPTIONS, ...opts };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 1200; // higher cap for fine detail
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const mask = buildBinaryMask(imageData.data, w, h, options.threshold);
      const components = extractContours(mask, options.turdSize);

      const tolerance = Math.max(0.3, 3 - options.curveOptimization * 2);
      const simplified = components.map((comp) => ({
        outer: douglasPeucker(comp.outer, tolerance),
        holes: comp.holes.map((h) => douglasPeucker(h, tolerance * 0.5)),
      }));

      const paths = simplified
        .map((comp) => componentToPath(comp))
        .filter((d) => d.length > 0);

      const pathElements = paths
        .map((d, i) => `  <path id="part-${i}" d="${d}" fill="${options.color}" fill-rule="evenodd" />`)
        .join("\n");

      const bg =
        options.background === "transparent"
          ? ""
          : ` style="background:${options.background}"`;

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"${bg}>\n${pathElements}\n</svg>`;

      resolve({ svg, width: w, height: h, pathCount: paths.length });
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}
