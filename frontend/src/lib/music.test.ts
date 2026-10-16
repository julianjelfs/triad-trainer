import { describe, expect, it } from 'vitest';
import { ALL_INVERSIONS, chordShapes } from './music';
import type { ChordItem, Inversion } from './types';

/** Open-string MIDI numbers, low E through high E. */
const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
const STRING_SETS = [
  [0, 1, 2],
  [1, 2, 3],
  [2, 3, 4],
  [3, 4, 5]
];

/** C major on strings 4-3-2. */
const cMajor432: ChordItem = { root_pc: 0, quality: 'major', string_set: 2 };

/** Every chord learning mode can show: 12 keys, 2 qualities, 4 string sets. */
function everyChord(): ChordItem[] {
  return Array.from({ length: 12 }, (_, root_pc) =>
    (['major', 'minor'] as const).flatMap((quality) =>
      [0, 1, 2, 3].map((string_set) => ({ root_pc, quality, string_set }))
    )
  ).flat();
}

function only(item: ChordItem, inversion: Inversion) {
  return chordShapes(item).filter((shape) => shape.item.inversion === inversion);
}

describe('chordShapes', () => {
  it('lays C major on 4-3-2 out up the neck, lowest first', () => {
    const positions = chordShapes(cMajor432);

    expect(positions.map((p) => [p.item.inversion, p.frets])).toEqual([
      ['first', [2, 0, 1]],
      ['second', [5, 5, 5]],
      ['root', [10, 9, 8]],
      ['first', [14, 12, 13]]
    ]);
  });

  it('shows every inversion at least once, all between the nut and fret 15', () => {
    for (const item of everyChord()) {
      const shapes = chordShapes(item);
      const label = JSON.stringify(item);
      for (const inversion of ALL_INVERSIONS) {
        expect(shapes.some((shape) => shape.item.inversion === inversion), label).toBe(true);
      }
      for (const shape of shapes) {
        expect(Math.min(...shape.frets), label).toBeGreaterThanOrEqual(0);
        expect(Math.max(...shape.frets), label).toBeLessThanOrEqual(15);
      }
    }
  });

  it('labels each dot with the chord tone it really sounds, so its colour is right', () => {
    for (const item of everyChord()) {
      for (const shape of chordShapes(item)) {
        shape.frets.forEach((fret, i) => {
          const sounding = (OPEN_MIDI[STRING_SETS[item.string_set][i]] + fret) % 12;
          expect(shape.tones[shape.order[i]], JSON.stringify(shape)).toBe(sounding);
        });
        expect(shape.tones.root).toBe(item.root_pc);
      }
    }
  });

  it('keeps D major root position at the twelfth fret, not stretched off the nut', () => {
    // D on the open D string is pitch-ascending with F# and A above it, but the
    // shape spans eleven frets. The playable voicing is the one an octave up.
    const positions = only({ root_pc: 2, quality: 'major', string_set: 2 }, 'root');

    expect(positions.map((p) => p.frets)).toEqual([[12, 11, 10]]);
  });

  it('voices each triad closed and within reach, every note above the one below it', () => {
    for (let root = 0; root < 12; root++) {
      for (const quality of ['major', 'minor'] as const) {
        for (let stringSet = 0; stringSet < 4; stringSet++) {
          const positions = chordShapes({ root_pc: root, quality, string_set: stringSet });
          expect(positions.length).toBeGreaterThanOrEqual(3);

          for (const shape of positions) {
            const pitches = shape.frets.map((fret, i) => OPEN_MIDI[STRING_SETS[stringSet][i]] + fret);
            expect(pitches[0]).toBeLessThan(pitches[1]);
            expect(pitches[1]).toBeLessThan(pitches[2]);
            expect(Math.max(...shape.frets)).toBeLessThanOrEqual(15);
            expect(Math.min(...shape.frets)).toBeGreaterThanOrEqual(0);
            expect(Math.max(...shape.frets) - Math.min(...shape.frets)).toBeLessThanOrEqual(4);
          }
        }
      }
    }
  });

  it('produces the standard movable grips, one per quality, string set and inversion', () => {
    // Every shape here should be a stock close-voiced triad: the same grip for
    // all twelve roots, just moved up the neck. Twenty-four grips in total, the
    // ones the CAGED forms are built from. A second pattern showing up for any
    // row means a voicing has been invented rather than transposed.
    const expected: Record<string, string> = {
      'major 0 root': '3-2-0',   'major 0 first': '2-0-0',  'major 0 second': '1-1-0',
      'major 1 root': '3-2-0',   'major 1 first': '2-0-0',  'major 1 second': '1-1-0',
      'major 2 root': '2-1-0',   'major 2 first': '2-0-1',  'major 2 second': '0-0-0',
      'major 3 root': '2-2-0',   'major 3 first': '1-0-0',  'major 3 second': '0-1-0',
      'minor 0 root': '3-1-0',   'minor 0 first': '1-0-0',  'minor 0 second': '2-2-0',
      'minor 1 root': '3-1-0',   'minor 1 first': '1-0-0',  'minor 1 second': '2-2-0',
      'minor 2 root': '2-0-0',   'minor 2 first': '1-0-1',  'minor 2 second': '1-1-0',
      'minor 3 root': '2-1-0',   'minor 3 first': '0-0-0',  'minor 3 second': '1-2-0'
    };

    for (const quality of ['major', 'minor'] as const) {
      for (let stringSet = 0; stringSet < 4; stringSet++) {
        for (const inversion of ALL_INVERSIONS) {
          const grips = new Set<string>();
          for (let root = 0; root < 12; root++) {
            for (const shape of only({ root_pc: root, quality, string_set: stringSet }, inversion)) {
              const lowest = Math.min(...shape.frets);
              grips.add(shape.frets.map((fret) => fret - lowest).join('-'));
            }
          }
          const key = `${quality} ${stringSet} ${inversion}`;
          expect([...grips], key).toEqual([expected[key]]);
        }
      }
    }
  });
});
