"use client";

import { TraceOptions, MotionConfig, DEFAULT_TRACE_OPTIONS, DEFAULT_MOTION_CONFIG } from "@/lib/types";
import { Sliders, Sparkles, Move, Clock, Repeat } from "lucide-react";

interface ControlPanelProps {
  traceOptions: TraceOptions;
  onTraceChange: (opts: TraceOptions) => void;
  motionConfig: MotionConfig;
  onMotionChange: (cfg: MotionConfig) => void;
}

export default function ControlPanel({
  traceOptions,
  onTraceChange,
  motionConfig,
  onMotionChange,
}: ControlPanelProps) {
  const updateTrace = (patch: Partial<TraceOptions>) => {
    onTraceChange({ ...traceOptions, ...patch });
  };

  const updateMotion = (patch: Partial<MotionConfig>) => {
    onMotionChange({ ...motionConfig, ...patch });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Trace Options */}
      <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-black/5 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-text-secondary" />
          <h3 className="text-sm font-semibold">矢量化参数</h3>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <SliderRow
            label="阈值"
            min={0} max={255} step={1}
            value={traceOptions.threshold}
            onChange={(v) => updateTrace({ threshold: v })}
            display={`${traceOptions.threshold}`}
          />
          <SliderRow
            label="噪点过滤"
            min={0} max={50} step={1}
            value={traceOptions.turdSize}
            onChange={(v) => updateTrace({ turdSize: v })}
            display={`${traceOptions.turdSize}px`}
          />
          <SliderRow
            label="曲线平滑"
            min={0} max={3} step={0.1}
            value={traceOptions.curveOptimization}
            onChange={(v) => updateTrace({ curveOptimization: v })}
            display={`${traceOptions.curveOptimization.toFixed(1)}`}
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary w-16">颜色</label>
            <input
              type="color"
              value={traceOptions.color}
              onChange={(e) => updateTrace({ color: e.target.value })}
              className="w-8 h-8 rounded-lg border border-black/10 cursor-pointer"
            />
            <span className="text-xs text-text-tertiary font-mono">{traceOptions.color}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary w-16">背景</label>
            <select
              value={traceOptions.background}
              onChange={(e) => updateTrace({ background: e.target.value })}
              className="flex-1 text-xs bg-black/5 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="transparent">透明</option>
              <option value="#ffffff">白色</option>
              <option value="#0d0d0d">黑色</option>
              <option value="#f5f5f3">浅灰</option>
            </select>
          </div>
          <button
            onClick={() => onTraceChange({ ...DEFAULT_TRACE_OPTIONS })}
            className="self-start text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            重置默认值
          </button>
        </div>
      </div>

      {/* Motion Options */}
      <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-black/5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-text-secondary" />
          <h3 className="text-sm font-semibold">动画参数</h3>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary w-16">模式</label>
            <select
              value={motionConfig.mode}
              onChange={(e) => updateMotion({ mode: e.target.value as MotionConfig["mode"] })}
              className="flex-1 text-xs bg-black/5 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="stagger-reveal">交错显现</option>
              <option value="draw-on">描边绘制</option>
              <option value="scale-pop">弹性弹出</option>
              <option value="fade-slide">淡入滑动</option>
              <option value="morph">形变入场</option>
            </select>
          </div>

          <SliderRow
            label="时长"
            min={300} max={3000} step={100}
            value={motionConfig.duration}
            onChange={(v) => updateMotion({ duration: v })}
            display={`${motionConfig.duration}ms`}
            icon={<Clock className="w-3 h-3 text-text-tertiary" />}
          />

          <SliderRow
            label="间隔"
            min={0} max={500} step={10}
            value={motionConfig.staggerDelay}
            onChange={(v) => updateMotion({ staggerDelay: v })}
            display={`${motionConfig.staggerDelay}ms`}
            icon={<Move className="w-3 h-3 text-text-tertiary" />}
          />

          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary w-16">方向</label>
            <select
              value={motionConfig.direction}
              onChange={(e) => updateMotion({ direction: e.target.value as MotionConfig["direction"] })}
              className="flex-1 text-xs bg-black/5 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="bottom">从下往上</option>
              <option value="top">从上往下</option>
              <option value="left">从左往右</option>
              <option value="right">从右往左</option>
              <option value="center">从中心</option>
            </select>
          </div>

          {motionConfig.mode === "scale-pop" && (
            <SliderRow
              label="过冲"
              min={1} max={1.3} step={0.01}
              value={motionConfig.scaleOvershoot}
              onChange={(v) => updateMotion({ scaleOvershoot: v })}
              display={`${motionConfig.scaleOvershoot.toFixed(2)}×`}
            />
          )}

          <div className="flex items-center gap-3">
            <Repeat className="w-3.5 h-3.5 text-text-tertiary" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={motionConfig.loop}
                onChange={(e) => updateMotion({ loop: e.target.checked })}
                className="w-4 h-4 accent-accent rounded"
              />
              <span className="text-xs text-text-secondary">循环播放</span>
            </label>
          </div>

          <button
            onClick={() => onMotionChange({ ...DEFAULT_MOTION_CONFIG })}
            className="self-start text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            重置默认值
          </button>
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
  display,
  icon,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  display: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs text-text-secondary">{label}</span>
        </div>
        <span className="text-xs text-text-tertiary font-mono">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
