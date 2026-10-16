export type Quality = 'major' | 'minor';
export type Inversion = 'root' | 'first' | 'second';
export type ChordTone = 'root' | 'third' | 'fifth';
export type Tonality = 'major' | 'minor';
export type Mode = 'learn' | 'comp';
export type CompInstrument = 'piano' | 'guitar';

/** One chord on one string set: everything needed to find its shapes. */
export interface ChordItem {
  root_pc: number;
  quality: Quality;
  string_set: number;
}

/** One inversion of a chord on a string set. */
export interface TriadItem extends ChordItem {
  inversion: Inversion;
}

export interface Settings {
  /** Root pitch class of the chord learning mode shows. */
  learn_key: number;
  learn_quality: Quality;
  learn_string_set: number;
  bpm: number;
  show_labels: boolean;
  mode: Mode;
  /** Tonic pitch class of the comping key. */
  comp_key: number;
  comp_progression: string;
  comp_string_set: number;
  comp_instrument: CompInstrument;
  comp_bpm: number;
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
