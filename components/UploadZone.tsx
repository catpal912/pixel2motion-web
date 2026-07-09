"use client";

import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";

interface UploadZoneProps {
  onImageSelect: (dataUrl: string) => void;
  image: string | null;
  onClear: () => void;
}

export default function UploadZone({ onImageSelect, image, onClear }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => onImageSelect(reader.result as string);
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      {!image ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`
            flex flex-col items-center justify-center gap-3
            rounded-2xl border-2 border-dashed p-10
            cursor-pointer transition-all duration-200
            ${dragOver
              ? "border-accent bg-red-50 scale-[1.01]"
              : "border-black/10 hover:border-black/25 hover:bg-black/[0.02]"
            }
          `}
        >
          <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center">
            <Upload className="w-5 h-5 text-text-secondary" />
          </div>
          <p className="text-sm font-medium text-text-primary">点击或拖拽上传 Logo 图片</p>
          <p className="text-xs text-text-tertiary">支持 PNG、JPG、WebP，建议透明背景</p>
          <input type="file" accept="image/*" className="hidden" onChange={onChange} />
        </label>
      ) : (
        <div className="relative rounded-2xl border border-black/8 overflow-hidden bg-white">
          <button
            onClick={onClear}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="p-6 flex items-center justify-center bg-[#f5f5f3]">
            <img
              src={image}
              alt="Original"
              className="max-h-48 max-w-full object-contain rounded-lg shadow-sm"
            />
          </div>
          <div className="px-4 py-3 flex items-center gap-2 text-xs text-text-secondary border-t border-black/5">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>原始图片</span>
          </div>
        </div>
      )}
    </div>
  );
}
