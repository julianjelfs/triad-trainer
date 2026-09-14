/**
 * Keys, progressions and where their chords sit near a spot on the neck.
 * Pure functions, like `music.ts`: comping mode's audio and screen both read
 * from here, and neither the backend nor the drill needs any of it.
 */
import { ALL_INVERSIONS, buildDrill } from './music';
import type { ChordTone, Quality, Shape, Tonality } from './types';

export interface ProgressionChord {
  /** Scale degree, 0 = tonic. */
  degree: number;
  quality: Quality;
  bars: number;
}

export interface Progression {
  id: string;
  name: string;
  tonality: Tonality;
  chords: ProgressionChord[];
}

/** A progression's chord worked out in a real key. */
export interface KeyChord {
  root_pc: number;
  quality: Quality;
  bars: number;
  /** Roman numeral, upper case for major, lower for minor. */
  numeral: string;
  /** Name as a chord symbol: "Bb", "C#m". */
  name: string;
  /** Each chord tone spelled on its own letter, so F major's IV is Bb, not A#. */
  spelling: Record<ChordTone, string>;
}

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const NATURAL_MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PCS = [0, 2, 4, 5, 7, 9, 11];

/**
 * How each tonic is written, as its letter index and pitch class. The flat or
 * sharp choice is the conventional key signature: Db major but C# minor.
 */
const TONIC_LETTERS: Record<Tonality, number[]> = {
  //       C  C#/Db D  D#/Eb E  F  F#/Gb G  G#/Ab A  A#/Bb B
  major: [0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6],
  minor: [0, 0, 1, 2, 2, 3, 3, 4, 4, 5, 6, 6]
};

/** Beats in every bar of a progression. */
export const BEATS_PER_BAR = 4;

/**
 * Frets each loop of the progression is played around, climbing one zone per
 * loop and wrapping back to the bottom. Two frets apart, so neighbouring zones
 * overlap and a new zone is never a leap.
 */
export const ZONE_ANCHORS = [1, 3, 5, 7, 9, 11];

const I = (degree: number, bars = 1): ProgressionChord => ({ degree, quality: 'major', bars });
const m = (degree: number, bars = 1): ProgressionChord => ({ degree, quality: 'minor', bars });

export const PROGRESSIONS: Progression[] = [
  { id: 'I-V-vi-IV', name: 'I–V–vi–IV', tonality: 'major', chords: [I(0), I(4), m(5), I(3)] },
  { id: 'I-vi-IV-V', name: 'I–vi–IV–V', tonality: 'major', chords: [I(0), m(5), I(3), I(4)] },
  { id: 'vi-IV-I-V', name: 'vi–IV–I–V', tonality: 'major', chords: [m(5), I(3), I(0), I(4)] },
  { id: 'I-IV-V-IV', name: 'I–IV–V–IV', tonality: 'major', chords: [I(0), I(3), I(4), I(3)] },
  { id: 'ii-V-I', name: 'ii–V–I', tonality: 'major', chords: [m(1), I(4), I(0, 2)] },
  {
    id: 'blues',
    name: '12-bar blues',
    tonality: 'major',
    chords: [I(0, 4), I(3, 2), I(0, 2), I(4), I(3), I(0), I(4)]
  },
  { id: 'i-VII-VI-VII', name: 'i–VII–VI–VII', tonality: 'minor', chords: [m(0), I(6), I(5), I(6)] },
  { id: 'i-VI-III-VII', name: 'i–VI–III–VII', tonality: 'minor', chords: [m(0), I(5), I(2), I(6)] },
  { id: 'andalusian', name: 'i–VII–VI–V', tonality: 'minor', chords: [m(0), I(6), I(5), I(4)] }
];

export function findProgression(id: string): Progression {
  return PROGRESSIONS.find((progression) => progression.id === id) ?? PROGRESSIONS[0];
}

/** A pitch class written on a given letter: 1 on letter D is "Db". */
function spellOn(letter: number, pitchClass: number): string {
  const offset = ((pitchClass - LETTER_PCS[letter] + 18) % 12) - 6;
  return LETTERS[letter] + (offset > 0 ? '#'.repeat(offset) : 'b'.repeat(-offset));
}

/** How the tonic itself is written in this tonality: "Eb", "G#". */
export function tonicName(tonicPc: number, tonality: Tonality): string {
  return spellOn(TONIC_LETTERS[tonality][tonicPc], tonicPc);
}

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export function chordsInKey(progression: Progression, tonicPc: number): KeyChord[] {
  const scale = progression.tonality === 'major' ? MAJOR_SCALE : NATURAL_MINOR_SCALE;
  const tonicLetter = TONIC_LETTERS[progression.tonality][tonicPc];

  return progression.chords.map(({ degree, quality, bars }) => {
    const root_pc = (tonicPc + scale[degree]) % 12;
    const letter = (tonicLetter + degree) % 7;
    const tones = triadTones(root_pc, quality);
    const spelling: Record<ChordTone, string> = {
      root: spellOn(letter, tones.root),
      third: spellOn((letter + 2) % 7, tones.third),
      fifth: spellOn((letter + 4) % 7, tones.fifth)
    };
    const numeral = quality === 'major' ? NUMERALS[degree] : NUMERALS[degree].toLowerCase();
    const name = spelling.root + (quality === 'minor' ? 'm' : '');
    return { root_pc, quality, bars, numeral, name, spelling };
  });
}

function triadTones(rootPc: number, quality: Quality): Record<ChordTone, number> {
  return {
    root: rootPc,
    third: (rootPc + (quality === 'major' ? 4 : 3)) % 12,
    fifth: (rootPc + 7) % 12
  };
}

function centre(shape: Shape): number {
  return (Math.min(...shape.frets) + Math.max(...shape.frets)) / 2;
}

/**
 * The triad of this chord on this string set that sits closest to a fret, by
 * the middle of the shape. On a tie the lower one wins, so the choice never
 * flickers between two equally good grips.
 */
export function nearestShape(chord: KeyChord, stringSet: number, anchor: number): Shape {
  const { positions } = buildDrill(
    { root_pc: chord.root_pc, quality: chord.quality, string_set: stringSet },
    ALL_INVERSIONS
  );

  let best = positions[0];
  for (const shape of positions) {
    const distance = Math.abs(centre(shape) - anchor);
    const bestDistance = Math.abs(centre(best) - anchor);
    if (distance < bestDistance || (distance === bestDistance && centre(shape) < centre(best))) {
      best = shape;
    }
  }
  return best;
}

/** Lowest note of the backing's bass register, C2. */
export const BASS_LOW = 36;
/** Lowest note of the backing's chord register, C3. */
export const CHORD_LOW = 48;

/**
 * What the backing plays for a chord, as MIDI notes: the root alone an octave
 * down, and the triad packed into the octave above it. Everything stays below
 * middle C, under the triads you are playing on top.
 */
export function accompanimentVoicing(chord: KeyChord): { bass: number; chord: number[] } {
  const tones = triadTones(chord.root_pc, chord.quality);
  return {
    bass: BASS_LOW + tones.root,
    chord: [tones.root, tones.third, tones.fifth]
      .map((pitchClass) => CHORD_LOW + pitchClass)
      .sort((a, b) => a - b)
  };
}

export type CompEvent =
  | { beat: number; kind: 'change'; chordIndex: number }
  | { beat: number; kind: 'bass'; note: number; beats: number }
  | { beat: number; kind: 'stab'; notes: number[]; beats: number };

/**
 * One loop of the backing, by beat. Bass on one and three, the chord on two
 * and four, so there is a pulse to lock to and space left for you. Beats, not
 * seconds, so the tempo can change without rebuilding it.
 */
export function timeline(chords: KeyChord[]): { beats: number; events: CompEvent[] } {
  const events: CompEvent[] = [];
  let beat = 0;

  chords.forEach((chord, chordIndex) => {
    const voicing = accompanimentVoicing(chord);
    events.push({ beat, kind: 'change', chordIndex });
    for (let bar = 0; bar < chord.bars; bar++) {
      for (let count = 0; count < BEATS_PER_BAR; count++) {
        const at = beat + bar * BEATS_PER_BAR + count;
        if (count % 2 === 0) events.push({ beat: at, kind: 'bass', note: voicing.bass, beats: 1.8 });
        else events.push({ beat: at, kind: 'stab', notes: voicing.chord, beats: 0.6 });
      }
    }
    beat += chord.bars * BEATS_PER_BAR;
  });

  return { beats: beat, events };
}
