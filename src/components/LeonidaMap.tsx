import { useEffect, useRef } from 'react';
import L from 'leaflet';
import mapMeta from '../data/mapMeta.json';
import { CATEGORIES } from '../data/locations';
import type { CategoryId, LocationItem } from '../types';

interface LeonidaMapProps {
  locations: LocationItem[];
  selectedId: string | null;
  visitedIds: Set<string>;
  onSelect: (loc: LocationItem | null) => void;
  flyTarget: { coords: [number, number]; zoom?: number; ts: number } | null;
  resetSignal: number;
  zoomCommand: { delta: number; ts: number } | null;
}

const MAX_NATIVE_ZOOM = mapMeta.maxZoom; // 5 (native 5382x7508)
const MAX_DISPLAY_ZOOM = MAX_NATIVE_ZOOM + 2.8; // 7.8 deep zoom
const MIN_DISPLAY_ZOOM = 1.2;
const SCALE_FACTOR = Math.pow(2, MAX_NATIVE_ZOOM);
const MAP_W = mapMeta.width / SCALE_FACTOR;
const MAP_H = mapMeta.height / SCALE_FACTOR;

export function pctToLatLng([xPct, yPct]: [number, number]): L.LatLngExpression {
  const lng = (xPct / 100) * MAP_W;
  const lat = -((yPct / 100) * MAP_H);
  return [lat, lng];
}

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  CategoryId,
  (typeof CATEGORIES)[number]
>;

const LOCK_SVG = `<svg width="7.5" height="7.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildMarkerIcon(loc: LocationItem, isSelected: boolean, isVisited: boolean): L.DivIcon {
  const meta = CATEGORY_MAP[loc.category];
  const lockBadge = loc.condition
    ? `<span class="leonida-dot-lock ${loc.condition.type === 'missable' ? 'is-missable' : ''}">${LOCK_SVG}</span>`
    : '';

  return L.divIcon({
    className: 'leonida-marker-wrapper',
    html: `
      <div class="leonida-dot-hit ${isSelected ? 'is-selected' : ''} ${isVisited ? 'is-visited' : ''}"
           style="--pin-color: ${meta.color}; --pin-glow: ${meta.glow};">
        <span class="leonida-dot"></span>
        ${lockBadge}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function buildTooltipHtml(loc: LocationItem): string {
  const meta = CATEGORY_MAP[loc.category];
  const lockLine = loc.condition
    ? `<div style="margin-top:5px; padding:3px 7px; border-radius:7px; background:${
        loc.condition.type === 'missable'
          ? 'rgba(255, 94, 98, 0.16)'
          : 'rgba(255, 179, 71, 0.14)'
      }; border:1px solid ${
        loc.condition.type === 'missable'
          ? 'rgba(255, 94, 98, 0.4)'
          : 'rgba(255, 179, 71, 0.36)'
      }; color:${
        loc.condition.type === 'missable' ? '#FF9A9E' : '#FFD166'
      }; font-size:11px; display:inline-flex; align-items:center; gap:5px; line-height:1.3;">
        <span style="flex-shrink:0; display:inline-flex;">${LOCK_SVG}</span>
        <span>${escapeHtml(loc.condition.shortLabel)}</span>
      </div>`
    : '';

  return `
    <div>
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="width:6px; height:6px; border-radius:999px; background:${meta.color}; box-shadow:0 0 8px ${meta.color}; flex-shrink:0;"></span>
        <span style="font-size:12.5px; font-weight:600; color:#FFFFFF; line-height:1.3;">${escapeHtml(loc.name)}</span>
      </div>
      ${lockLine}
    </div>
  `;
}

export function LeonidaMap({
  locations,
  selectedId,
  visitedIds,
  onSelect,
  flyTarget,
  resetSignal,
  zoomCommand,
}: LeonidaMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const bounds = L.latLngBounds([
      [-MAP_H, 0],
      [0, MAP_W],
    ]);
    const paddedBounds = bounds.pad(0.22);

    const map = L.map(el, {
      crs: L.CRS.Simple,
      minZoom: MIN_DISPLAY_ZOOM,
      maxZoom: MAX_DISPLAY_ZOOM,
      // Continuous fractional zoom (0 = no snapping stutter for pinch/trackpad!)
      zoomSnap: 0,
      zoomDelta: 0.9,
      // Custom high-responsiveness trackpad pinch, wheel & touch pinch zoom below
      scrollWheelZoom: false,
      touchZoom: false,
      bounceAtZoomLimits: false,
      zoomControl: false,
      attributionControl: false,
      maxBounds: paddedBounds,
      maxBoundsViscosity: 0.85,
      inertia: true,
      inertiaDeceleration: 2600,
    });

    const baseUrl = import.meta.env.BASE_URL || './';
    L.tileLayer(`${baseUrl}tiles/{z}/{x}/{y}.jpg`, {
      tileSize: mapMeta.tileSize,
      minZoom: 0,
      maxZoom: MAX_DISPLAY_ZOOM,
      maxNativeZoom: MAX_NATIVE_ZOOM,
      noWrap: true,
      bounds,
      keepBuffer: 4,
      updateWhenIdle: false,
      updateWhenZooming: true,
    }).addTo(map);

    map.fitBounds(bounds, { padding: [20, 20] });

    // Responsive 120fps trackpad pinch + two-finger scroll + mouse wheel zoom
    let rafId: number | null = null;
    let pendingDelta = 0;
    let lastClientX = 0;
    let lastClientY = 0;

    const flushZoom = () => {
      rafId = null;
      if (pendingDelta === 0) return;
      const delta = pendingDelta;
      pendingDelta = 0;

      const currentZoom = map.getZoom();
      const targetZoom = Math.min(
        MAX_DISPLAY_ZOOM,
        Math.max(MIN_DISPLAY_ZOOM, currentZoom + delta),
      );
      if (Math.abs(targetZoom - currentZoom) < 0.0005) return;

      const rect = el.getBoundingClientRect();
      const point = L.point(lastClientX - rect.left, lastClientY - rect.top);
      map.setZoomAround(point, targetZoom, { animate: false });
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 32; // DOM_DELTA_LINE
      else if (e.deltaMode === 2) dy *= 240; // DOM_DELTA_PAGE

      // Trackpad pinch sets ctrlKey=true with small deltaY: use high sensitivity
      // Two-finger scroll / wheel: responsive & smooth scaling
      const sensitivity = e.ctrlKey ? 0.022 : 0.0055;
      const step = Math.max(-0.85, Math.min(0.85, -dy * sensitivity));

      pendingDelta += step;
      lastClientX = e.clientX;
      lastClientY = e.clientY;

      if (rafId === null) {
        rafId = requestAnimationFrame(flushZoom);
      }
    };

    // Safari desktop trackpad native gesture events fallback
    let gestureBaseZoom = map.getZoom();
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureBaseZoom = map.getZoom();
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const ge = e as unknown as { scale: number; clientX?: number; clientY?: number };
      if (!ge.scale) return;
      const targetZoom = Math.min(
        MAX_DISPLAY_ZOOM,
        Math.max(MIN_DISPLAY_ZOOM, gestureBaseZoom + Math.log2(ge.scale) * 1.45),
      );
      const rect = el.getBoundingClientRect();
      const pt = L.point(
        (ge.clientX ?? rect.left + rect.width / 2) - rect.left,
        (ge.clientY ?? rect.top + rect.height / 2) - rect.top,
      );
      map.setZoomAround(pt, targetZoom, { animate: false });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('gesturestart', onGestureStart, { passive: false } as AddEventListenerOptions);
    el.addEventListener('gesturechange', onGestureChange, { passive: false } as AddEventListenerOptions);

    // High-responsiveness touchscreen two-finger pinch zoom (1.6x responsive gain)
    let pinchLastDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        map.dragging.disable();
        pinchLastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchLastDist > 0) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        if (dist > 0) {
          const ratio = dist / pinchLastDist;
          const zoomDelta = Math.log2(ratio) * 1.6;
          if (Math.abs(zoomDelta) > 0.002) {
            const rect = el.getBoundingClientRect();
            const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
            const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
            const nextZ = Math.min(
              MAX_DISPLAY_ZOOM,
              Math.max(MIN_DISPLAY_ZOOM, map.getZoom() + zoomDelta),
            );
            map.setZoomAround(L.point(cx, cy), nextZ, { animate: false });
          }
          pinchLastDist = dist;
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchLastDist = 0;
        map.dragging.enable();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    map.on('click', () => {
      onSelectRef.current(null);
    });

    const markersLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = markersLayer;

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('gesturestart', onGestureStart);
      el.removeEventListener('gesturechange', onGestureChange);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    for (const loc of locations) {
      const isSelected = loc.id === selectedId;
      const isVisited = visitedIds.has(loc.id);

      const marker = L.marker(pctToLatLng(loc.coords), {
        icon: buildMarkerIcon(loc, isSelected, isVisited),
        zIndexOffset: isSelected ? 900 : loc.condition ? 150 : 0,
      });

      marker.bindTooltip(buildTooltipHtml(loc), {
        direction: 'auto',
        offset: [0, -10],
        className: 'leonida-tooltip',
        opacity: 1,
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectRef.current(loc);
      });

      marker.addTo(group);
    }
  }, [locations, selectedId, visitedIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTarget) return;
    const targetZoom = flyTarget.zoom ?? Math.max(map.getZoom(), 4.8);
    map.flyTo(pctToLatLng(flyTarget.coords), Math.min(MAX_DISPLAY_ZOOM, targetZoom), {
      duration: 0.65,
      easeLinearity: 0.25,
    });
  }, [flyTarget]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || resetSignal === 0) return;
    const bounds = L.latLngBounds([
      [-MAP_H, 0],
      [0, MAP_W],
    ]);
    map.flyToBounds(bounds, { padding: [20, 20], duration: 0.65 });
  }, [resetSignal]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !zoomCommand) return;
    const nextZoom = Math.min(
      MAX_DISPLAY_ZOOM,
      Math.max(MIN_DISPLAY_ZOOM, map.getZoom() + zoomCommand.delta),
    );
    map.setZoom(nextZoom, { animate: true });
  }, [zoomCommand]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full touch-none"
      style={{ backgroundColor: mapMeta.oceanColor }}
    />
  );
}
