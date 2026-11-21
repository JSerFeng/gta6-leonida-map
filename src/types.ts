export type CategoryId = 'trigger' | 'detail' | 'wilderness' | 'landmark';

export type CountyId = 'vice-dale' | 'mariana' | 'kelly' | 'leonard' | 'lummox';

export type ConditionType = 'chapter' | 'missable' | 'time' | 'tool' | 'weather';

export interface UnlockCondition {
  type: ConditionType;
  /** Minimum chapter number required (1..5), or chapter where missable occurs */
  chapter?: number;
  /** Short badge label shown on hover tooltip & lock pill */
  shortLabel: string;
  /** Non-spoiler explanation of the condition */
  detail: string;
}

export interface LocationItem {
  id: string;
  /** 100% spoiler-free title */
  name: string;
  /** Geographic sub-label */
  subtitle: string;
  county: CountyId;
  regionLabel: string;
  category: CategoryId;
  /** Percentage coordinates on the official Leonida map image: [xPct (0..100), yPct (0..100)] */
  coords: [number, number];
  /** Spoiler-free guidance: where to look / approach */
  whereToLook: string;
  /** Spoiler-free guidance: how to interact / trigger */
  howToTrigger: string;
  /** Optional non-spoiler practical note */
  tip?: string;
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
