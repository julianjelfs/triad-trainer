import { describe, expect, it } from 'vitest';
import { buildDrill, shapePosition } from './music';
import type { DrillItem, Inversion } from './types';

const ALL_INVERSIONS: Inversion[] = ['root', 'first', 'second'];

/** C major on strings 4-3-2. */
const cMajor432: DrillItem = { root_pc: 0, quality: 'major', string_set: 2 };

describe('buildDrill', () => {
  it('walks the neck from the lowest position upwards', () => {
    const { positions } = buildDrill(cMajor432, ALL_INVERSIONS);

    expect(positions.map((p) => [p.item.inversion, p.frets])).toEqual([
      ['first', [2, 0, 1]],
      ['second', [5, 5, 5]],
      ['root', [10, 9, 8]],
      ['first', [14, 12, 13]]
    ]);
  });

  it('orders every drill by position, whatever order the inversions arrive in', () => {
    const shuffled = buildDrill(cMajor432, ['second', 'root', 'first']);
    const positions = shuffled.positions.map(shapePosition);

    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('only includes the inversions that are enabled', () => {
    const { positions } = buildDrill(cMajor432, ['root']);

    expect(positions.map((p) => p.frets)).toEqual([[10, 9, 8]]);
  });

  it('keeps D major root position at the twelfth fret, not stretched off the nut', () => {
    // D on the open D string is pitch-ascending with F# and A above it, but the
    // shape spans eleven frets. The playable voicing is the one an octave up.
    const { positions } = buildDrill({ root_pc: 2, quality: 'major', string_set: 2 }, ['root']);

    expect(positions.map((p) => p.frets)).toEqual([[12, 11, 10]]);
  });

  it('voices each triad closed and within reach, every note above the one below it', () => {
    // Open-string MIDI numbers, low E through high E.
    const openMidi = [40, 45, 50, 55, 59, 64];
    const stringSets = [
      [0, 1, 2],
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5]
    ];

    for (let root = 0; root < 12; root++) {
      for (const quality of ['major', 'minor'] as const) {
        for (let stringSet = 0; stringSet < 4; stringSet++) {
          const { positions } = buildDrill({ root_pc: root, quality, string_set: stringSet }, ALL_INVERSIONS);
          expect(positions.length).toBeGreaterThanOrEqual(3);

          for (const shape of positions) {
            const pitches = shape.frets.map((fret, i) => openMidi[stringSets[stringSet][i]] + fret);
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
            const drill = buildDrill({ root_pc: root, quality, string_set: stringSet }, [inversion]);
            for (const shape of drill.positions) {
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

  it('puts the right chord tones on the right strings for each inversion', () => {
    const { positions } = buildDrill(cMajor432, ALL_INVERSIONS);
    const rootPosition = positions.find((p) => p.item.inversion === 'root')!;

    expect(rootPosition.order).toEqual(['root', 'third', 'fifth']);
    expect(rootPosition.tones).toEqual({ root: 0, third: 4, fifth: 7 });
  });
});
