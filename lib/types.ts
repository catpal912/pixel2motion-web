export interface TraceOptions {
  threshold: number;
  turdSize: number;
  alphaMax: number;
  curveOptimization: number;
  optTolerance: number;
  color: string;
  background: string;
}

export interface MotionConfig {
  mode: "draw-on" | "stagger-reveal" | "scale-pop" | "fade-slide" | "morph";
  duration: number;
  staggerDelay: number;
  easing: string;
  scaleOvershoot: number;
  direction: "left" | "right" | "top" | "bottom" | "center";
  loop: boolean;
}

export interface ProcessedPart {
  id: string;
  tag: string;
  attrs: Record<string, string>;
  children: ProcessedPart[];
  text?: string;
}

export interface ProjectState {
  originalImage: string | null;
  svgMarkup: string;
  svgParts: ProcessedPart[];
  motionConfig: MotionConfig;
  traceOptions: TraceOptions;
  isProcessing: boolean;
  activePartId: string | null;
}

export const DEFAULT_TRACE_OPTIONS: TraceOptions = {
  threshold: 128,
  turdSize: 0,
  alphaMax: 1.0,
  curveOptimization: 1.0,
  optTolerance: 0.2,
  color: "#0d0d0d",
  background: "#ffffff",
};

export const DEFAULT_MOTION_CONFIG: MotionConfig = {
  mode: "stagger-reveal",
  duration: 1500,
  staggerDelay: 120,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  scaleOvershoot: 1.08,
  direction: "bottom",
  loop: false,
};
