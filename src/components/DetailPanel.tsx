import {
  Check,
  Crosshair,
  Eye,
  Lock,
  Radio,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import { CATEGORIES } from '../data/locations';
import type { LocationItem } from '../types';

interface DetailPanelProps {
  location: LocationItem | null;
  isVisited: boolean;
  onToggleVisited: (id: string) => void;
  onClose: () => void;
  onFocusMap: (loc: LocationItem) => void;
}

export function DetailPanel({
  location,
  isVisited,
  onToggleVisited,
  onClose,
  onFocusMap,
}: DetailPanelProps) {
  if (!location) return null;

  const cat = CATEGORIES.find((c) => c.id === location.category)!;
  const isMissable = location.condition?.type === 'missable';

  return (
    <aside
      aria-label="地点详情"
      className="fixed z-[1100] right-4 top-[132px] lg:top-[74px] bottom-20 sm:bottom-auto sm:max-h-[calc(100vh-152px)] w-[calc(100vw-2rem)] sm:w-[344px] vice-glass rounded-2xl overflow-hidden flex flex-col"
    >
      {/* Signature GTA VI Sunset Hairline */}
      <div className="h-[2px] w-full vice-sunset-bar shrink-0" />

      {/* Minimal Editorial Header */}
      <div className="px-5 pt-4 pb-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide"
              style={{ color: cat.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}` }}
              />
              {cat.label}
            </span>

            {location.wainkScannable && (
              <>
                <span className="text-white/20">·</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono-code text-[#2EE6D6]/90">
                  <Radio className="w-3 h-3" />
                  WAiNK
                </span>
              </>
            )}
          </div>

          <h2 className="text-[19px] font-bold text-white leading-snug tracking-tight">
            {location.name}
          </h2>
          <p className="text-[12px] text-white/45 mt-0.5">{location.regionLabel}</p>
        </div>

        <button
          onClick={onClose}
          aria-label="关闭"
          className="p-1.5 -mr-1 -mt-1 rounded-xl text-white/45 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Editorial Body */}
      <div className="px-5 pb-4 space-y-4 overflow-y-auto flex-1">
        {/* Unlock Condition Ribbon (when gated) */}
        {location.condition && (
          <div
            className={`rounded-xl px-3.5 py-2.5 border ${
              isMissable
                ? 'bg-[#FF5E62]/10 border-[#FF5E62]/30'
                : 'bg-[#FFB347]/8 border-[#FFB347]/28'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={isMissable ? 'text-[#FF9A9E]' : 'text-[#FFD166]'}>
                {isMissable ? <Timer className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              </span>
              <span
                className={`text-xs font-semibold ${
                  isMissable ? 'text-[#FF9A9E]' : 'text-[#FFD166]'
                }`}
              >
                {location.condition.shortLabel}
              </span>
            </div>
            <p className="text-[12px] leading-relaxed text-white/75">
              {location.condition.detail}
            </p>
          </div>
        )}

        {/* Where to Look */}
        <section className="space-y-1.5 pt-1 border-t border-white/[0.07]">
          <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-white/40 pt-2">
            <Eye className="w-3 h-3 text-[#2EE6D6]" />
            <span>观察</span>
          </div>
          <p className="text-[13.5px] leading-relaxed text-white/90">{location.whereToLook}</p>
        </section>

        {/* How to Trigger */}
        <section className="space-y-1.5 border-t border-white/[0.07] pt-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-white/40">
            <Sparkles className="w-3 h-3 text-[#FF4D8D]" />
            <span>触发</span>
          </div>
          <p className="text-[13.5px] leading-relaxed text-white/90">{location.howToTrigger}</p>
        </section>

        {location.tip && (
          <p className="text-[12px] leading-relaxed text-white/50 border-t border-white/[0.07] pt-3">
            {location.tip}
          </p>
        )}
      </div>

      {/* Minimal Action Footer */}
      <div className="px-5 py-3 border-t border-white/[0.08] flex items-center gap-2 shrink-0">
        <button
          onClick={() => onToggleVisited(location.id)}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
            isVisited
              ? 'bg-[#2EE6D6]/14 border-[#2EE6D6]/40 text-[#2EE6D6] hover:bg-[#2EE6D6]/22'
              : 'bg-white/[0.06] border-white/10 text-white/90 hover:bg-white/[0.12]'
          }`}
        >
          <Check className={`w-3.5 h-3.5 ${isVisited ? 'opacity-100' : 'opacity-40'}`} />
          <span>{isVisited ? '已探索' : '标记已探索'}</span>
        </button>

        <button
          onClick={() => onFocusMap(location)}
          title="放大聚焦"
          aria-label="放大聚焦"
          className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-[#FF4D8D]/25 to-[#FFB347]/20 border border-[#FF4D8D]/35 text-white hover:from-[#FF4D8D]/40 hover:to-[#FFB347]/35 transition-all cursor-pointer shrink-0"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
