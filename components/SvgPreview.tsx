"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Gauge, Download } from "lucide-react";
import { parseSVG, flattenParts } from "@/lib/svgUtils";
import { generateMotion } from "@/lib/motionEngine";
import { MotionConfig } from "@/lib/types";
import { downloadFile } from "@/lib/svgUtils";

interface SvgPreviewProps {
  svgString: string;
  motionConfig: MotionConfig;
}

export default function SvgPreview({ svgString, motionConfig }: SvgPreviewProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [generatedCSS, setGeneratedCSS] = useState("");

  const rootPart = parseSVG(svgString);
  const parts = rootPart ? flattenParts(rootPart) : [];

  // Inject generated CSS into a <style> tag inside the stage
  useEffect(() => {
    if (!svgString || parts.length === 0) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svg = doc.documentElement;
    if (!svg || svg.tagName.toLowerCase() !== "svg") return;

    const w = parseInt(svg.getAttribute("width") || "400");
    const h = parseInt(svg.getAttribute("height") || "400");

    const motion = generateMotion(parts, w, h, motionConfig);
    setGeneratedCSS(motion.css);

    if (stageRef.current) {
      stageRef.current.innerHTML = "";

      const style = document.createElement("style");
      style.textContent = motion.css;
      stageRef.current.appendChild(style);

      const stageInner = document.createElement("div");
      stageInner.id = "motion-stage";
      stageInner.style.cssText = "width:100%; display:flex; justify-content:center;";

      const svgClone = svg.cloneNode(true) as SVGSVGElement;
      svgClone.style.width = "100%";
      svgClone.style.height = "auto";
      svgClone.style.maxWidth = `${Math.min(w * 0.7, 600)}px`;
      stageInner.appendChild(svgClone);
      stageRef.current.appendChild(stageInner);
    }
  }, [svgString, motionConfig, parts.length]);

  // Control playback speed
  useEffect(() => {
    if (!stageRef.current) return;
    const els = stageRef.current.querySelectorAll<HTMLElement>("#motion-stage [id]");
    els.forEach((el) => {
      const dur = motionConfig.duration / speed;
      el.style.animationDuration = `${dur}ms`;
    });
  }, [speed, motionConfig.duration]);

  const togglePlay = () => {
    if (!stageRef.current) return;
    const els = stageRef.current.querySelectorAll<HTMLElement>("#motion-stage [id]");
    els.forEach((el) => {
      el.style.animationPlayState = isPlaying ? "paused" : "running";
    });
    setIsPlaying(!isPlaying);
  };

  const replay = () => {
    if (!stageRef.current) return;
    const els = stageRef.current.querySelectorAll<HTMLElement>("#motion-stage [id]");
    els.forEach((el) => {
      el.style.animationName = "none";
      void el.offsetHeight;
      el.style.animationName = "";
      el.style.animationPlayState = isPlaying ? "running" : "paused";
    });
  };

  const downloadHTML = () => {
    if (!rootPart) return;
    const w = 400;
    const h = 400;
    const motion = generateMotion(parts, w, h, motionConfig);
    downloadFile(motion.html, "logo_motion.html", "text/html");
  };

  const downloadSVG = () => {
    downloadFile(svgString, "logo.svg", "image/svg+xml");
  };

  if (!svgString) {
    return (
      <div className="rounded-2xl border border-black/8 bg-white p-10 flex flex-col items-center justify-center gap-3 text-text-secondary">
        <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
          <Gauge className="w-5 h-5" />
        </div>
        <p className="text-sm">上传图片并转换后，动画将在此预览</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">
      {/* Stage */}
      <div className="p-8 bg-[#f5f5f3] min-h-[280px] flex items-center justify-center">
        <div ref={stageRef} className="w-full" />
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-t border-black/5 flex items-center gap-2 flex-wrap">
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
          title={isPlaying ? "暂停" : "播放"}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={replay}
          className="w-9 h-9 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
          title="重播"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-black/10 mx-1" />

        <div className="flex items-center gap-2 flex-1 min-w-[120px]">
          <Gauge className="w-3.5 h-3.5 text-text-tertiary" />
          <input
            type="range"
            min={0.25}
            max={2}
            step={0.25}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-text-secondary w-10 text-right">{speed}×</span>
        </div>

        <div className="h-6 w-px bg-black/10 mx-1" />

        <button
          onClick={downloadSVG}
          className="px-3 h-9 rounded-lg bg-black/5 hover:bg-black/10 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> SVG
        </button>
        <button
          onClick={downloadHTML}
          className="px-3 h-9 rounded-lg bg-accent text-white hover:bg-red-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> HTML
        </button>
      </div>
    </div>
  );
}
