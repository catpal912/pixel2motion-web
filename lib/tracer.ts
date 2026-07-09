/**
 * Browser-based image tracer: Canvas pixel read → binary threshold →
 * marching-squares contour extraction → Douglas–Peucker simplification →
 * SVG path string.
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
  turdSize: 2,
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

/* Marching Squares contour extraction */
function extractContours(mask: boolean[][], turdSize: number): Array<Array<{ x: number; y: number }>> {
  const h = mask.length;
  const w = mask[0]?.length || 0;
  const visited = Array.from({ length: h }, () => Array(w).fill(false));
  const contours: Array<Array<{ x: number; y: number }>> = [];

  const dirs = [
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: -1 },
  ];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y][x] || visited[y][x]) continue;

      // Find an edge pixel that has an unvisited background neighbor
      let startX = x;
      let startY = y;
      let isEdge = false;
      for (let dy = -1; dy <= 1 && !isEdge; dy++) {
        for (let dx = -1; dx <= 1 && !isEdge; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ny = y + dy;
          const nx = x + dx;
          if (ny < 0 || ny >= h || nx < 0 || nx >= w || !mask[ny][nx]) {
            isEdge = true;
          }
        }
      }
      if (!isEdge) {
        visited[y][x] = true;
        continue;
      }

      // Trace contour
      const contour: Array<{ x: number; y: number }> = [];
      let cx = startX;
      let cy = startY;
      let dir = 0;

      do {
        contour.push({ x: cx, y: cy });
        visited[cy][cx] = true;

        let found = false;
        for (let i = 0; i < 4; i++) {
          const ndir = (dir + 3 + i) % 4;
          const nx = cx + dirs[ndir].dx;
          const ny = cy + dirs[ndir].dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && mask[ny][nx] && !visited[ny][nx]) {
            // Check if this neighbor is an edge
            let neighborIsEdge = false;
            for (let dy2 = -1; dy2 <= 1 && !neighborIsEdge; dy2++) {
              for (let dx2 = -1; dx2 <= 1 && !neighborIsEdge; dx2++) {
                if (dx2 === 0 && dy2 === 0) continue;
                const nnx = nx + dx2;
                const nny = ny + dy2;
                if (nnx < 0 || nnx >= w || nny < 0 || nny >= h || !mask[nny][nnx]) {
                  neighborIsEdge = true;
                }
              }
            }
            if (neighborIsEdge) {
              cx = nx;
              cy = ny;
              dir = ndir;
              found = true;
              break;
            }
          }
        }
        if (!found) break;
      } while ((cx !== startX || cy !== startY) && contour.length < w * h);

      if (contour.length >= turdSize) {
        contours.push(contour);
      }
    }
  }

  return contours;
}

/* Douglas–Peucker simplification */
function douglasPeucker(
  points: Array<{ x: number; y: number }>,
  tolerance: number
): Array<{ x: number; y: number }> {
  if (points.length <= 2) return points;

  const stack: Array<[number, number]> = [[0, points.length - 1]];
  const keep = new Set<number>([0, points.length - 1]);

  while (stack.length) {
    const [start, end] = stack.pop()!;
    if (end <= start + 1) continue;

    const sx = points[start].x;
    const sy = points[start].y;
    const ex = points[end].x;
    const ey = points[end].y;
    const dx = ex - sx;
    const dy = ey - sy;
    const segLen = Math.sqrt(dx * dx + dy * dy) || 1;

    let maxDist = -1;
    let maxIdx = -1;
    for (let i = start + 1; i < end; i++) {
      const dist = Math.abs(dy * points[i].x - dx * points[i].y + ex * sy - ey * sx) / segLen;
      if (dist > maxDist) {
        maxDist = dist;
        maxIdx = i;
      }
    }

    if (maxDist > tolerance) {
      keep.add(maxIdx);
      stack.push([start, maxIdx]);
      stack.push([maxIdx, end]);
    }
  }

  return Array.from(keep)
    .sort((a, b) => a - b)
    .map((i) => points[i]);
}

/* Convert points to SVG path with simple smoothing */
function pointsToPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return "";
  // Close if near
  const closed =
    Math.hypot(points[0].x - points[points.length - 1].x, points[0].y - points[points.length - 1].y) < 2;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  if (points.length === 2) {
    d += ` L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  } else {
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
    }
  }

  if (closed) d += " Z";
  return d;
}

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
      // Scale down large images for performance
      const maxDim = 800;
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
      const rawContours = extractContours(mask, options.turdSize);

      const tolerance = Math.max(0.5, 3 - options.curveOptimization * 2);
      const simplified = rawContours.map((c) => douglasPeucker(c, tolerance));
      const paths = simplified.map(pointsToPath).filter((p) => p.length > 0);

      const pathElements = paths
        .map((d, i) => `  <path id="part-${i}" d="${d}" fill="${options.color}" />`)
        .join("\n");

      const bg =
        options.background === "transparent"
          ? ""
          : ` style="background:${options.background}"`;

      const svg = `&lt;svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"${bg}&gt;\n${pathElements}\n&lt;/svg&gt;`;

      resolve({ svg, width: w, height: h, pathCount: paths.length });
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}
