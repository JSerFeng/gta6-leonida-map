import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  List,
  Lock,
  Maximize2,
  Minus,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { LeonidaMap } from './components/LeonidaMap';
import { DetailPanel } from './components/DetailPanel';
import { CATEGORIES, CHAPTER_OPTIONS, COUNTIES, LOCATIONS } from './data/locations';
import type { CategoryId, LocationItem } from './types';

const STORAGE_KEY = 'gta6-leonida-visited-v1';

function loadVisited(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

export default function App() {
  const [activeCategories, setActiveCategories] = useState<Set<CategoryId>>(
    () => new Set(CATEGORIES.map((c) => c.id)),
  );
  const [onlyConditional, setOnlyConditional] = useState(false);
  const [chapterProgress, setChapterProgress] = useState<number>(0);
  const [hideVisited, setHideVisited] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedLoc, setSelectedLoc] = useState<LocationItem | null>(null);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(() => loadVisited());

  const [flyTarget, setFlyTarget] = useState<{
    coords: [number, number];
    zoom?: number;
    ts: number;
  } | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [zoomCommand, setZoomCommand] = useState<{ delta: number; ts: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(visitedIds)));
    } catch {
      // ignore storage errors
    }
  }, [visitedIds]);

  const toggleCategory = (id: CategoryId) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) {
          return new Set(CATEGORIES.map((c) => c.id));
        }
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleVisited = (id: string) => {
    setVisitedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return LOCATIONS.filter((loc) => {
      if (!activeCategories.has(loc.category)) return false;
      if (onlyConditional && !loc.condition) return false;
      if (hideVisited && visitedIds.has(loc.id)) return false;

      if (chapterProgress > 0) {
        const req = loc.condition?.chapter ?? 1;
        if (loc.condition?.type === 'missable') {
          if (chapterProgress !== req) return false;
        } else if (req > chapterProgress) {
          return false;
        }
      }

      if (q) {
        const hay = `${loc.name} ${loc.subtitle} ${loc.regionLabel} ${loc.condition?.shortLabel ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [activeCategories, onlyConditional, hideVisited, visitedIds, chapterProgress, searchQuery]);

  const handleSelectLocation = (loc: LocationItem | null) => {
    setSelectedLoc(loc);
    if (loc && window.innerWidth < 1024) {
      setDrawerOpen(false);
    }
  };

  const handleSelectFromList = (loc: LocationItem) => {
    setSelectedLoc(loc);
    setFlyTarget({ coords: loc.coords, zoom: 5.2, ts: Date.now() });
    if (window.innerWidth < 1024) {
      setDrawerOpen(false);
    }
  };

  const handleToggleDrawer = () => {
    setDrawerOpen((prev) => {
      const next = !prev;
      if (next && window.innerWidth < 1024) {
        setSelectedLoc(null);
      }
      return next;
    });
  };

  const handleFocusLocation = (loc: LocationItem) => {
    setFlyTarget({ coords: loc.coords, zoom: 5.8, ts: Date.now() });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#080610]">
      {/* Full-Viewport Official High-Res Leonida Interactive Map */}
      <LeonidaMap
        locations={filteredLocations}
        selectedId={selectedLoc?.id ?? null}
        visitedIds={visitedIds}
        onSelect={handleSelectLocation}
        flyTarget={flyTarget}
        resetSignal={resetSignal}
        zoomCommand={zoomCommand}
      />

      {/* Top Subtle Atmospheric Scrim */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-24 bg-gradient-to-b from-[#080610]/55 via-[#080610]/15 to-transparent z-[900]" />

      {/* Minimal Floating Top HUD */}
      <header className="fixed top-4 inset-x-4 z-[1050] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Brand Capsule */}
        <div className="pointer-events-auto vice-glass rounded-full pl-2 pr-3.5 py-1.5 flex items-center gap-2.5">
          <button
            onClick={handleToggleDrawer}
            title="地点目录"
            aria-label="地点目录"
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              drawerOpen
                ? 'bg-[#FF4D8D]/25 text-[#FF4D8D]'
                : 'text-white/75 hover:text-white hover:bg-white/10'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[21px] leading-none vice-gradient-text">VI</span>
            <span className="font-display text-[19px] leading-none tracking-[0.14em] text-white/95">
              LEONIDA
            </span>
          </div>

          <span className="text-[11px] font-mono-code text-white/45 pl-0.5">
            {visitedIds.size}/{LOCATIONS.length}
          </span>
        </div>

        {/* Minimal Filter Capsule */}
        <div className="pointer-events-auto vice-glass rounded-full px-1.5 py-1 flex items-center gap-0.5 overflow-x-auto max-w-full">
          {CATEGORIES.map((cat) => {
            const active = activeCategories.has(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                title={cat.shortDesc}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'text-white bg-white/[0.11]'
                    : 'text-white/35 hover:text-white/70'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full transition-opacity"
                  style={{
                    backgroundColor: cat.color,
                    boxShadow: active ? `0 0 8px ${cat.color}` : 'none',
                    opacity: active ? 1 : 0.3,
                  }}
                />
                <span>{cat.label}</span>
              </button>
            );
          })}

          <div className="h-3.5 w-px bg-white/12 mx-1 shrink-0" />

          {/* Icon-only Condition Lock Toggle */}
          <button
            onClick={() => setOnlyConditional((v) => !v)}
            title="仅看含解锁条件"
            aria-label="仅看含解锁条件"
            className={`w-7 h-7 rounded-full inline-flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              onlyConditional
                ? 'bg-[#FFB347]/22 text-[#FFD166]'
                : 'text-white/55 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
          </button>

          {/* Compact Chapter Filter */}
          <select
            aria-label="章节筛选"
            value={chapterProgress}
            onChange={(e) => setChapterProgress(Number(e.target.value))}
            className="shrink-0 whitespace-nowrap bg-transparent hover:bg-white/[0.08] rounded-full px-2.5 py-1 text-xs font-mono-code text-white/80 outline-none cursor-pointer transition-colors"
          >
            {CHAPTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#120d22] text-white">
                {opt.label}
              </option>
            ))}
          </select>

          {/* Hide Visited Toggle */}
          {visitedIds.size > 0 && (
            <button
              onClick={() => setHideVisited((v) => !v)}
              title={hideVisited ? '显示已探索' : '隐藏已探索'}
              aria-label={hideVisited ? '显示已探索' : '隐藏已探索'}
              className={`w-7 h-7 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                hideVisited
                  ? 'bg-[#2EE6D6]/20 text-[#2EE6D6]'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {hideVisited ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </header>

      {/* Collapsible Left Minimalist Directory */}
      {drawerOpen && (
        <aside
          aria-label="地点目录"
          className="fixed z-[1080] left-4 top-[132px] lg:top-[74px] bottom-16 w-[calc(100vw-2rem)] sm:w-[296px] vice-glass rounded-2xl overflow-hidden flex flex-col"
        >
          <div className="h-[2px] w-full vice-sunset-bar shrink-0" />

          <div className="p-2.5 border-b border-white/[0.08] flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-white/35 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索..."
                className="w-full bg-white/[0.05] border border-white/[0.08] focus:border-[#FF4D8D]/50 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-white/30 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded-xl text-white/45 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="关闭目录"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {filteredLocations.length === 0 ? (
              <div className="py-12 text-center text-xs text-white/35">无匹配地点</div>
            ) : (
              filteredLocations.map((loc) => {
                const cat = CATEGORIES.find((c) => c.id === loc.category)!;
                const isSelected = selectedLoc?.id === loc.id;
                const isVisited = visitedIds.has(loc.id);
                const isMissable = loc.condition?.type === 'missable';

                return (
                  <button
                    key={loc.id}
                    onClick={() => handleSelectFromList(loc)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-white/[0.12] text-white'
                        : 'hover:bg-white/[0.06] text-white/85'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span
                        className={`text-[13px] truncate ${
                          isVisited ? 'text-white/40 line-through' : ''
                        }`}
                      >
                        {loc.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {loc.condition && (
                        <span
                          title={loc.condition.shortLabel}
                          className={isMissable ? 'text-[#FF9A9E]' : 'text-[#FFD166]'}
                        >
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                      {isVisited && <Check className="w-3.5 h-3.5 text-[#2EE6D6]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      )}

      {/* Right Detail Card */}
      <DetailPanel
        location={selectedLoc}
        isVisited={selectedLoc ? visitedIds.has(selectedLoc.id) : false}
        onToggleVisited={toggleVisited}
        onClose={() => setSelectedLoc(null)}
        onFocusMap={handleFocusLocation}
      />

      {/* Bottom-Left Pure County Pills */}
      <nav
        aria-label="区域定位"
        className="fixed bottom-4 left-4 z-[1040] hidden md:flex items-center gap-0.5 vice-glass rounded-full p-1"
      >
        {COUNTIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setFlyTarget({ coords: c.center, zoom: c.zoom, ts: Date.now() })}
            className="px-3 py-1 rounded-full text-[11.5px] text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {c.label}
          </button>
        ))}
      </nav>

      {/* Bottom-Right Icon-Only Zoom Controls */}
      <div className="fixed bottom-4 right-4 z-[1040]">
        <div className="vice-glass rounded-full p-1 flex flex-col gap-0.5">
          <button
            onClick={() => setZoomCommand({ delta: 0.9, ts: Date.now() })}
            aria-label="放大"
            title="放大"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomCommand({ delta: -0.9, ts: Date.now() })}
            aria-label="缩小"
            title="缩小"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="h-px bg-white/10 mx-2 my-0.5" />
          <button
            onClick={() => setResetSignal((n) => n + 1)}
            aria-label="重置视角"
            title="重置视角"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/75 hover:text-[#2EE6D6] hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
