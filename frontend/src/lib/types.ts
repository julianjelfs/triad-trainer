export type Quality = 'major' | 'minor';
export type Inversion = 'root' | 'first' | 'second';
export type ChordTone = 'root' | 'third' | 'fifth';

/** One chord on one string set. What the backend hands back as the next drill. */
export interface DrillItem {
  root_pc: number;
  quality: Quality;
  string_set: number;
}

/** One step of a drill. Mirrors the API's TriadItem. */
export interface TriadItem extends DrillItem {
  inversion: Inversion;
}

export interface Settings {
  qualities: Quality[];
  sets: number[];
  inversions: Inversion[];
  roots: number[];
  bpm: number;
  show_labels: boolean;
}

export interface ItemStat extends TriadItem {
  count: number;
  last_practised_at: string | null;
}

export interface RootStat {
  root_pc: number;
  count: number;
}

export interface PracticeStats {
  total: number;
  by_root: RootStat[];
  items: ItemStat[];
}

/** A TriadItem worked out into fret positions ready to draw. */
export interface Shape {
  item: TriadItem;
  /** Fret per string, index 0 = lowest-pitched string of the set. */
  frets: number[];
  /** Which chord tone sits on each of those strings. */
  order: ChordTone[];
  /** Pitch class of each chord tone. */
  tones: Record<ChordTone, number>;
}

/** A drill's shapes, ordered from the lowest position on the neck to the highest. */
export interface Drill {
  item: DrillItem;
  positions: Shape[];
}
