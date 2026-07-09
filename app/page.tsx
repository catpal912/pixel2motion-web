"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles, Github, ArrowRight } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import SvgPreview from "@/components/SvgPreview";
import ControlPanel from "@/components/ControlPanel";
import { traceImage } from "@/lib/tracer";
import {
  TraceOptions,
  MotionConfig,
  DEFAULT_TRACE_OPTIONS,
  DEFAULT_MOTION_CONFIG,
} from "@/lib/types";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [svgString, setSvgString] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [traceOptions, setTraceOptions] = useState<TraceOptions>(DEFAULT_TRACE_OPTIONS);
  const [motionConfig, setMotionConfig] = useState<MotionConfig>(DEFAULT_MOTION_CONFIG);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(
    async (src: string) => {
      setIsProcessing(true);
      setError(null);
      try {
        const result = await traceImage(src, traceOptions);
        setSvgString(result.svg);
      } catch (e) {
        setError("图片转换失败，请尝试其他图片。");
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    },
    [traceOptions]
  );

  // Auto-process when image or trace options change
  useEffect(() => {
    if (image) {
      const timer = setTimeout(() => processImage(image), 300);
      return () => clearTimeout(timer);
    }
  }, [image, traceOptions, processImage]);

  const handleImageSelect = useCallback((src: string) => {
    setImage(src);
  }, []);

  const handleClear = useCallback(() => {
    setImage(null);
    setSvgString("");
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-sm font-bold tracking-tight">Pixel2Motion Web</h1>
          </div>
          <a
            href="https://github.com/catpal912/pixel2motion"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            GitHub
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        {!image && (
          <div className="text-center mb-10 animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Logo 像素 → SVG → 动画
            </h2>
            <p className="text-text-secondary max-w-md mx-auto mb-8">
              在浏览器中将图片 Logo 转换为矢量 SVG，并生成可导出的 CSS 动画 HTML。无需服务器，完全免费。
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-text-tertiary">
              <span className="px-2 py-1 rounded-md bg-black/5">完全前端运行</span>
              <ArrowRight className="w-3 h-3" />
              <span className="px-2 py-1 rounded-md bg-black/5">可部署到 Vercel</span>
              <ArrowRight className="w-3 h-3" />
              <span className="px-2 py-1 rounded-md bg-black/5">导出独立 HTML</span>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <UploadZone
              image={image}
              onImageSelect={handleImageSelect}
              onClear={handleClear}
            />
            <ControlPanel
              traceOptions={traceOptions}
              onTraceChange={setTraceOptions}
              motionConfig={motionConfig}
              onMotionChange={setMotionConfig}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {isProcessing && (
              <div className="rounded-2xl border border-black/8 bg-white p-8 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                <p className="text-sm text-text-secondary">正在转换... </p>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <SvgPreview svgString={svgString} motionConfig={motionConfig} />

            {/* Static SVG Preview */}
            {svgString && (
              <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
                  <span className="text-sm font-semibold">SVG 源码</span>
                  <span className="text-xs text-text-tertiary">可复制到设计软件</span>
                </div>
                <div className="p-4">
                  <textarea
                    readOnly
                    value={svgString}
                    className="w-full h-40 text-xs font-mono bg-[#f5f5f3] rounded-xl p-3 resize-none outline-none border border-black/5"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 py-6 mt-10">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-xs text-text-tertiary">
          <span>基于 Pixel2Motion 开源项目构建</span>
          <span>部署到 Vercel · 零服务器成本</span>
        </div>
      </footer>
    </div>
  );
}
