import { ProcessedPart } from "./types";

export function parseSVG(svgString: string): ProcessedPart | null {
  if (typeof DOMParser === "undefined") return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const root = doc.documentElement;
  if (root.tagName.toLowerCase() !== "svg") return null;
  return elementToPart(root);
}

function elementToPart(el: Element): ProcessedPart {
  const attrs: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    attrs[attr.name] = attr.value;
  }

  const children: ProcessedPart[] = [];
  for (const child of Array.from(el.children)) {
    const tag = child.tagName.toLowerCase();
    if (tag === "defs" || tag === "metadata" || tag === "title") continue;
    children.push(elementToPart(child));
  }

  const text = el.textContent?.trim() || undefined;

  return {
    id: attrs.id || generateId(el.tagName.toLowerCase()),
    tag: el.tagName.toLowerCase(),
    attrs,
    children,
    text,
  };
}

let _idCounter = 0;
function generateId(tag: string): string {
  return `${tag}-${++_idCounter}`;
}

export function flattenParts(root: ProcessedPart): ProcessedPart[] {
  const result: ProcessedPart[] = [];
  const animatable = ["path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "text", "g"];
  if (animatable.includes(root.tag)) {
    result.push(root);
  }
  for (const child of root.children) {
    result.push(...flattenParts(child));
  }
  return result;
}

export function buildSVGString(parts: ProcessedPart[], width: number, height: number, background?: string): string {
  const viewBox = `0 0 ${width} ${height}`;
  const bgStyle = background && background !== "transparent" ? ` style="background:${background}"` : "";
  const childrenMarkup = parts.map((p) => partToString(p, 2)).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}"${bgStyle}>\n${childrenMarkup}\n</svg>`;
}

function partToString(part: ProcessedPart, indent: number): string {
  const pad = "  ".repeat(indent);
  const attrStr = Object.entries(part.attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");

  const tag = part.tag;
  const open = `${pad}<${tag}${attrStr ? " " + attrStr : ""}>`;

  if (part.children.length === 0 && !part.text) {
    return `${pad}<${tag}${attrStr ? " " + attrStr : ""} />`;
  }

  if (part.text && part.children.length === 0) {
    return `${open}${part.text}</${tag}>`;
  }

  const childStr = part.children.map((c) => partToString(c, indent + 1)).join("\n");
  const textStr = part.text ? "\n" + "  ".repeat(indent + 1) + part.text : "";
  return `${open}${textStr}\n${childStr}\n${pad}</${tag}>`;
}

export function downloadFile(content: string, filename: string, mime: string = "text/plain") {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
