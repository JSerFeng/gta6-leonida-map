export type CategoryId = 'trigger' | 'detail' | 'wilderness' | 'landmark';

export type CountyId = 'vice-dale' | 'mariana' | 'kelly' | 'leonard' | 'lummox';

export type ConditionType = 'chapter' | 'missable' | 'time' | 'tool' | 'weather';

export interface UnlockCondition {
  type: ConditionType;
  /** Minimum chapter number required (1..5), or chapter where missable occurs */
  chapter?: number;
  /** Short badge label shown on hover tooltip & lock pill */
  shortLabel: string;
}

export interface LocationItem {
  id: string;
  /** 100% spoiler-free title */
  name: string;
  /** Geographic sub-label (used for search) */
  subtitle: string;
  county: CountyId;
  regionLabel: string;
  category: CategoryId;
  /** Percentage coordinates on the official Leonida map image: [xPct (0..100), yPct (0..100)] */
  coords: [number, number];
  /** Concise, zero-spoiler guidance combining where to look and how to interact */
  description: string;
  /** Direct canonical source guide URL (never shown verbatim in UI to avoid URL-slug spoilers) */
  sourceUrl: string;
  /** Short publisher name shown on source chip (e.g. IGN, PowerPyx, Beebom) */
  sourceLabel: string;
  /** Optional progression / time / tool / weather condition (shows lock icon) */
  condition?: UnlockCondition;
  /** Optional WAiNK app scan tag (non-spoiler) */
  wainkScannable?: boolean;
}

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  shortDesc: string;
  color: string;
  glow: string;
}

export interface CountyMeta {
  id: CountyId;
  label: string;
  enLabel: string;
  /** Approximate map center [xPct, yPct] & target zoom for quick jump */
  center: [number, number];
  zoom: number;
}
