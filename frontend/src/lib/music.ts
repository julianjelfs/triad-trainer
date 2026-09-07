/**
 * Guitar triad theory. Pure functions, no DOM, no network — the backend never
 * needs to know any of this, it only deals in the item's four identifying fields.
 */
import type { ChordTone, Drill, DrillItem, Inversion, Quality, Shape, TriadItem } from './types';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Every root as a pitch class, 0 = C. */
export const ALL_ROOTS = NOTE_NAMES.map((_, index) => index);

/** Open-string pitches as MIDI numbers, index 0..5 = low E, A, D, G, B, high E. */
const OPEN_MIDI = [40, 45, 50, 55, 59, 64];

/** Highest fret a shape is allowed to reach, and the right edge of the diagram. */
export const MAX_FRET = 15;

/** Semitones in an octave; a shape repeats at this interval up the neck. */
const OCTAVE = 12;

/**
 * Widest fret span allowed in one voicing. Close triads on three adjacent
 * strings never span more than three frets, so this rejects the arrangements
 * that are in the right pitch order but need a hand a foot wide.
 */
const MAX_SPAN = 4;

export interface StringSet {
  indices: number[];
  label: string;
  /** String names, lowest-pitched first. */
  names: string[];
}

export const STRING_SETS: StringSet[] = [
  { indices: [0, 1, 2], label: 'Strings 6-5-4', names: ['low E', 'A', 'D'] },
  { indices: [1, 2, 3], label: 'Strings 5-4-3', names: ['A', 'D', 'G'] },
  { indices: [2, 3, 4], label: 'Strings 4-3-2', names: ['D', 'G', 'B'] },
  { indices: [3, 4, 5], label: 'Strings 3-2-1', names: ['G', 'B', 'high E'] }
];

export const QUALITIES: { value: Quality; label: string }[] = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' }
];

export const INVERSIONS: { value: Inversion; label: string }[] = [
  { value: 'root', label: 'Root position' },
  { value: 'first', label: 'First inversion' },
  { value: 'second', label: 'Second inversion' }
];

/** Which chord tone lands on each string, lowest-pitched string first. */
const TONE_ORDER: Record<Inversion, ChordTone[]> = {
  root: ['root', 'third', 'fifth'],
  first: ['third', 'fifth', 'root'],
  second: ['fifth', 'root', 'third']
};

export function inversionLabel(inversion: Inversion): string {
  return INVERSIONS.find((i) => i.value === inversion)!.label;
}

export function noteName(pitchClass: number): string {
  return NOTE_NAMES[pitchClass];
}

export function describe(item: TriadItem): string {
  return `${noteName(item.root_pc)} ${item.quality} — ${inversionLabel(item.inversion)}`;
}

/**
 * Every playable spot on the neck for one inversion, lowest first.
 *
 * Each string's chord tone fixes its fret to within an octave, so there are
 * eight ways to distribute the three notes across octaves. A voicing is kept
 * when the notes ascend across the strings and the hand can reach it, and each
 * keeper then repeats every twelve frets until it runs off the neck.
 */
function neckPositions(item: TriadItem): number[][] {
  const { indices } = STRING_SETS[item.string_set];
  const tones = chordTones(item);
  const order = TONE_ORDER[item.inversion];
  const base = indices.map(
    (stringIndex, i) => (((tones[order[i]] - OPEN_MIDI[stringIndex]) % OCTAVE) + OCTAVE) % OCTAVE
  );

  const found = new Map<string, number[]>();

  for (let octaveMask = 0; octaveMask < 8; octaveMask++) {
    let frets = base.map((fret, i) => fret + ((octaveMask >> i) & 1 ? OCTAVE : 0));
    const pitches = frets.map((fret, i) => OPEN_MIDI[indices[i]] + fret);

    if (pitches[0] >= pitches[1] || pitches[1] >= pitches[2]) continue;
    if (Math.max(...frets) - Math.min(...frets) > MAX_SPAN) continue;

    while (Math.min(...frets) - OCTAVE >= 0) frets = frets.map((fret) => fret - OCTAVE);
    for (; Math.max(...frets) <= MAX_FRET; frets = frets.map((fret) => fret + OCTAVE)) {
      found.set(frets.join(','), frets);
    }
  }

  return [...found.values()].sort((a, b) => Math.min(...a) - Math.min(...b));
}

function chordTones(item: TriadItem): Record<ChordTone, number> {
  const thirdInterval = item.quality === 'major' ? 4 : 3;
  return {
    root: item.root_pc,
    third: (item.root_pc + thirdInterval) % 12,
    fifth: (item.root_pc + 7) % 12
  };
}

function shapeAt(item: TriadItem, frets: number[]): Shape {
  return { item, frets, order: TONE_ORDER[item.inversion], tones: chordTones(item) };
}

/** Lowest fret the shape reaches; what the cycle is ordered by. */
export function shapePosition(shape: Shape): number {
  return Math.min(...shape.frets);
}

/**
 * Every playable position of the given inversions, ordered up the neck.
 *
 * Each inversion repeats an octave higher until it runs off the end of the
 * neck, so a drill walks the same three shapes through two or so octaves
 * before it wraps back to the bottom.
 */
export function buildDrill(item: DrillItem, inversions: Inversion[]): Drill {
  const positions: Shape[] = [];

  for (const inversion of inversions) {
    const triad: TriadItem = { ...item, inversion };
    for (const frets of neckPositions(triad)) {
      positions.push(shapeAt(triad, frets));
    }
  }

  positions.sort((a, b) => shapePosition(a) - shapePosition(b));
  return { item, positions };
}
