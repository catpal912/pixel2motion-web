import { MotionConfig, ProcessedPart } from "./types";

export interface GeneratedMotion {
  css: string;
  html: string;
  parts: string[];
}

export function generateMotion(
  parts: ProcessedPart[],
  width: number,
  height: number,
  config: MotionConfig
): GeneratedMotion {
  const partIds = parts.map((p) => p.id || generatePartId(p.tag));
  const css = buildCSS(partIds, config);
  const html = buildShowcaseHTML(parts, width, height, partIds, config, css);
  return { css, html, parts: partIds };
}

let _partId = 0;
function generatePartId(tag: string): string {
  return `${tag}-${++_partId}`;
}

function buildCSS(partIds: string[], config: MotionConfig): string {
  const { mode, duration, staggerDelay, easing, scaleOvershoot, direction, loop } = config;
  const animationFill = "both";
  const iteration = loop ? "infinite" : "1";

  let css = `/* Pixel2Motion generated animation */\n`;
  css += `:root {\n  --p2m-duration: ${duration}ms;\n  --p2m-ease: ${easing};\n}\n\n`;

  // Base styles
  css += `#motion-stage svg {\n  width: 100%;\n  height: auto;\n  display: block;\n}\n`;
  css += `#motion-stage [id] {\n  animation-fill-mode: ${animationFill};\n  animation-iteration-count: ${iteration};\n}\n\n`;

  switch (mode) {
    case "draw-on":
      css += buildDrawOnCSS(partIds, duration, staggerDelay, easing);
      break;
    case "stagger-reveal":
      css += buildStaggerRevealCSS(partIds, duration, staggerDelay, easing, direction);
      break;
    case "scale-pop":
      css += buildScalePopCSS(partIds, duration, staggerDelay, easing, scaleOvershoot);
      break;
    case "fade-slide":
      css += buildFadeSlideCSS(partIds, duration, staggerDelay, easing, direction);
      break;
    case "morph":
      css += buildMorphCSS(partIds, duration, staggerDelay, easing);
      break;
  }

  // Reduced motion
  css += `\n@media (prefers-reduced-motion: reduce) {\n`;
  css += `  #motion-stage [id] { animation: none !important; opacity: 1 !important; transform: none !important; }\n`;
  css += `}\n`;

  return css;
}

/* Draw-on (stroke-dasharray) */
function buildDrawOnCSS(ids: string[], duration: number, stagger: number, easing: string): string {
  let css = `@keyframes drawOn {\n`;
  css += `  from { stroke-dashoffset: 1; }\n`;
  css += `  to   { stroke-dashoffset: 0; }\n}\n\n`;

  ids.forEach((id, i) => {
    const delay = i * stagger;
    css += `#${id} {\n`;
    css += `  stroke-dasharray: 1;\n`;
    css += `  stroke-dashoffset: 1;\n`;
    css += `  animation-name: drawOn;\n`;
    css += `  animation-duration: ${duration}ms;\n`;
    css += `  animation-delay: ${delay}ms;\n`;
    css += `  animation-timing-function: ${easing};\n`;
    css += `}\n`;
  });
  return css;
}

/* Staggered reveal (opacity + translate) */
function buildStaggerRevealCSS(
  ids: string[],
  duration: number,
  stagger: number,
  easing: string,
  direction: string
): string {
  let css = `@keyframes staggerReveal {\n`;
  css += `  from { opacity: 0; transform: translate(var(--tx,0), var(--ty,20px)) scale(0.96); }\n`;
  css += `  to   { opacity: 1; transform: translate(0,0) scale(1); }\n}\n\n`;

  const dirMap: Record<string, [number, number]> = {
    left: ["-30px", "0"],
    right: ["30px", "0"],
    top: ["0", "-30px"],
    bottom: ["0", "30px"],
    center: ["0", "0"],
  };
  const [tx, ty] = dirMap[direction] || ["0", "20px"];

  ids.forEach((id, i) => {
    const delay = i * stagger;
    css += `#${id} {\n`;
    css += `  --tx: ${tx}; --ty: ${ty};\n`;
    css += `  opacity: 0;\n`;
    css += `  animation-name: staggerReveal;\n`;
    css += `  animation-duration: ${duration}ms;\n`;
    css += `  animation-delay: ${delay}ms;\n`;
    css += `  animation-timing-function: ${easing};\n`;
    css += `}\n`;
  });
  return css;
}

/* Scale pop with overshoot */
function buildScalePopCSS(
  ids: string[],
  duration: number,
  stagger: number,
  easing: string,
  overshoot: number
): string {
  const overshootPct = Math.round((overshoot - 1) * 100);
  let css = `@keyframes scalePop {\n`;
  css += `  0%   { opacity: 0; transform: scale(0.5); }\n`;
  css += `  70%  { opacity: 1; transform: scale(${overshoot}); }\n`;
  css += `  100% { opacity: 1; transform: scale(1); }\n`;
  css += `}\n\n`;

  ids.forEach((id, i) => {
    const delay = i * stagger;
    const tx = "var(--origin-x, 50%)";
    const ty = "var(--origin-y, 50%)";
    css += `#${id} {\n`;
    css += `  transform-box: fill-box;\n`;
    css += `  transform-origin: center;\n`;
    css += `  opacity: 0;\n`;
    css += `  animation-name: scalePop;\n`;
    css += `  animation-duration: ${duration}ms;\n`;
    css += `  animation-delay: ${delay}ms;\n`;
    css += `  animation-timing-function: ${easing};\n`;
    css += `}\n`;
  });
  return css;
}

/* Fade slide */
function buildFadeSlideCSS(
  ids: string[],
  duration: number,
  stagger: number,
  easing: string,
  direction: string
): string {
  let css = `@keyframes fadeSlide {\n`;
  css += `  from { opacity: 0; transform: translate(var(--tx,0), var(--ty,0)); }\n`;
  css += `  to   { opacity: 1; transform: translate(0,0); }\n`;
  css += `}\n\n`;

  const dirMap: Record<string, [number, number]> = {
    left: ["-40px", "0"],
    right: ["40px", "0"],
    top: ["0", "-40px"],
    bottom: ["0", "40px"],
    center: ["0", "20px"],
  };
  const [tx, ty] = dirMap[direction] || ["0", "20px"];

  ids.forEach((id, i) => {
    const delay = i * stagger;
    css += `#${id} {\n`;
    css += `  --tx: ${tx}; --ty: ${ty};\n`;
    css += `  opacity: 0;\n`;
    css += `  animation-name: fadeSlide;\n`;
    css += `  animation-duration: ${duration}ms;\n`;
    css += `  animation-delay: ${delay}ms;\n`;
    css += `  animation-timing-function: ${easing};\n`;
    css += `}\n`;
  });
  return css;
}

/* Morph (simple opacity cascade simulating morph) */
function buildMorphCSS(ids: string[], duration: number, stagger: number, easing: string): string {
  let css = `@keyframes morphIn {\n`;
  css += `  0%   { opacity: 0; transform: scale(0.8) rotate(-5deg); }\n`;
  css += `  60%  { opacity: 1; transform: scale(1.02) rotate(1deg); }\n`;
  css += `  100% { opacity: 1; transform: scale(1) rotate(0deg); }\n`;
  css += `}\n\n`;

  ids.forEach((id, i) => {
    const delay = i * stagger;
    css += `#${id} {\n`;
    css += `  transform-box: fill-box;\n`;
    css += `  transform-origin: center;\n`;
    css += `  opacity: 0;\n`;
    css += `  animation-name: morphIn;\n`;
    css += `  animation-duration: ${duration}ms;\n`;
    css += `  animation-delay: ${delay}ms;\n`;
    css += `  animation-timing-function: ${easing};\n`;
    css += `}\n`;
  });
  return css;
}

function buildShowcaseHTML(
  parts: ProcessedPart[],
  width: number,
  height: number,
  partIds: string[],
  config: MotionConfig,
  css: string
): string {
  const svgInner = parts.map((p) => partToHTML(p)).join("\n    ");
  const viewBox = `0 0 ${width} ${height}`;

  return `&lt;!doctype html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;
  &lt;meta charset="utf-8"&gt;
  &lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;
  &lt;title&gt;Logo Motion&lt;/title&gt;
  &lt;style&gt;
    html, body { margin: 0; padding: 0; background: #FCFCFA; }
    body { display: grid; place-items: center; min-height: 100vh; }
    #stage { width: min(70vw, ${Math.round(width * 0.7)}px); }
    ${css.replace(/^/gm, "    ")}
  &lt;/style&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;div id="stage"&gt;
    &lt;svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}"&gt;
    ${svgInner}
    &lt;/svg&gt;
  &lt;/div&gt;
  &lt;script&gt;
    // Replay helper
    function replay() {
      document.querySelectorAll('#stage [id]').forEach(el =&gt; {
        el.style.animationName = 'none';
        el.offsetHeight; // force reflow
        el.style.animationName = '';
      });
    }
    window.addEventListener('keydown', e =&gt; { if (e.key === ' ') replay(); });
  &lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;`;
}

function partToHTML(part: ProcessedPart): string {
  const attrs = Object.entries(part.attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  if (part.children.length === 0 && !part.text) {
    return `&lt;${part.tag} ${attrs} /&gt;`;
  }
  const inner = part.children.map(partToHTML).join("\n    ");
  const text = part.text || "";
  return `&lt;${part.tag} ${attrs}&gt;${text}${inner ? "\n    " + inner : ""}&lt;/${part.tag}&gt;`;
}
