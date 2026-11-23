import {
  Check,
  Crosshair,
  ExternalLink,
  Lock,
  Radio,
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
      key={location.id}
      aria-label="地点详情"
      className="fixed z-[1100] inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] max-h-[52vh] sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-[74px] sm:w-[300px] sm:max-h-[calc(100vh-92px)] vice-glass vice-detail-enter rounded-2xl overflow-hidden flex flex-col"
    >
      {/* GTA VI Sunset Accent Hairline */}
      <div className="h-[2px] w-full vice-sunset-bar shrink-0" />

      {/* Header */}
      <div className="px-4 pt-3.5 pb-3 flex items-start justify-between gap-2.5 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-medium"
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
                <span className="inline-flex items-center gap-1 text-[10.5px] font-mono-code text-[#2EE6D6]/90">
                  <Radio className="w-2.5 h-2.5" />
                  WAiNK
                </span>
              </>
            )}
          </div>

          <h2 className="text-[16.5px] font-bold text-white leading-snug tracking-tight">
            {location.name}
          </h2>
          <p className="text-[11.5px] text-white/45 mt-0.5">
            {location.regionLabel}
            {location.precision === 'area' && (
              <span className="text-white/35"> · 大致区域</span>
            )}
          </p>

          {/* Compact Single-Line Condition Pill */}
          {location.condition && (
            <div
              className={`mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-medium border max-w-full ${
                isMissable
                  ? 'bg-[#FF5E62]/12 border-[#FF5E62]/35 text-[#FF9A9E]'
                  : 'bg-[#FFB347]/10 border-[#FFB347]/30 text-[#FFD166]'
              }`}
            >
              {isMissable ? (
                <Timer className="w-3 h-3 shrink-0" />
              ) : (
                <Lock className="w-3 h-3 shrink-0" />
              )}
              <span className="truncate">{location.condition.shortLabel}</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          aria-label="关闭"
          className="p-1.5 -mr-1 -mt-1 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Single Minimalist Description Block + Zero-Spoiler Source Chip */}
      <div className="px-4 py-3.5 border-t border-white/[0.07] overflow-y-auto">
        <p className="text-[13.5px] leading-[1.68] text-white/88">{location.description}</p>

        {location.sourceUrl && (
          <div className="mt-3 flex items-center">
            <a
              href={location.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`查看来源（${location.sourceLabel}）`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] hover:border-white/[0.16] text-[11px] font-medium text-white/55 hover:text-white/90 transition-colors whitespace-nowrap max-w-full"
            >
              <ExternalLink className="w-3 h-3 shrink-0 text-[#2EE6D6]/75" />
              <span className="truncate">来源 · {location.sourceLabel}</span>
            </a>
          </div>
        )}
      </div>

      {/* Compact Footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.08] flex items-center gap-2 shrink-0">
        <button
          onClick={() => onToggleVisited(location.id)}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 sm:py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
            isVisited
              ? 'bg-[#2EE6D6]/14 border-[#2EE6D6]/40 text-[#2EE6D6] hover:bg-[#2EE6D6]/22'
              : 'bg-white/[0.06] border-white/10 text-white/85 hover:bg-white/[0.12]'
          }`}
        >
          <Check className={`w-3.5 h-3.5 ${isVisited ? 'opacity-100' : 'opacity-40'}`} />
          <span>{isVisited ? '已探索' : '标记已探索'}</span>
        </button>

        <button
          onClick={() => onFocusMap(location)}
          title="放大聚焦"
          aria-label="放大聚焦"
          className="w-9 h-9 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-[#FF4D8D]/25 to-[#FFB347]/20 border border-[#FF4D8D]/35 text-white hover:from-[#FF4D8D]/40 hover:to-[#FFB347]/35 transition-all cursor-pointer shrink-0"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
