import { describe, expect, it } from 'vitest';
import {
  BASS_LOW,
  CHORD_LOW,
  PROGRESSIONS,
  accompanimentVoicing,
  chordsInKey,
  findProgression,
  nearestShape,
  timeline
} from './harmony';
import { ALL_INVERSIONS, MAX_FRET, buildDrill } from './music';
import type { KeyChord } from './harmony';
import type { Quality, Shape } from './types';

const LETTER_PCS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTERS = 'CDEFGAB';

/** Pitch class a spelled note name stands for: "Bb" is 10, "E#" is 5. */
function pitchOf(name: string): number {
  const accidentals = name.slice(1);
  const shift = [...accidentals].reduce((sum, mark) => sum + (mark === '#' ? 1 : -1), 0);
  return (LETTER_PCS[name[0]] + shift + 12) % 12;
}

function chord(root_pc: number, quality: Quality): KeyChord {
  const spelling = { root: '', third: '', fifth: '' };
  return { root_pc, quality, bars: 1, numeral: '', name: '', spelling };
}

function centre(shape: Shape): number {
  return (Math.min(...shape.frets) + Math.max(...shape.frets)) / 2;
}

describe('chordsInKey', () => {
  // Invariant 1
  it('builds the diatonic chords of the progression in the chosen key', () => {
    const inG = chordsInKey(findProgression('I-V-vi-IV'), 7);
    expect(inG.map((c) => [c.name, c.root_pc, c.quality])).toEqual([
      ['G', 7, 'major'],
      ['D', 2, 'major'],
      ['Em', 4, 'minor'],
      ['C', 0, 'major']
    ]);

    const inA = chordsInKey(findProgression('i-VII-VI-VII'), 9);
    expect(inA.map((c) => c.name)).toEqual(['Am', 'G', 'F', 'G']);
    expect(inA.map((c) => c.numeral)).toEqual(['i', 'VII', 'VI', 'VII']);
  });

  // Invariant 2
  it('spells F major IV as Bb and Db major as flats', () => {
    expect(chordsInKey(findProgression('I-IV-V-IV'), 5).map((c) => c.name)).toEqual([
      'F',
      'Bb',
      'C',
      'Bb'
    ]);
    expect(chordsInKey(findProgression('I-V-vi-IV'), 1).map((c) => c.name)).toEqual([
      'Db',
      'Ab',
      'Bbm',
      'Gb'
    ]);
  });

  // Invariant 2
  it('spells every chord tone in stacked thirds, each name meaning the right pitch', () => {
    for (const progression of PROGRESSIONS) {
      for (let tonic = 0; tonic < 12; tonic++) {
        for (const c of chordsInKey(progression, tonic)) {
          const { root, third, fifth } = c.spelling;
          const letter = (name: string) => LETTERS.indexOf(name[0]);

          expect((letter(third) - letter(root) + 7) % 7, c.name).toBe(2);
          expect((letter(fifth) - letter(root) + 7) % 7, c.name).toBe(4);
          expect(pitchOf(root)).toBe(c.root_pc);
          expect(pitchOf(third)).toBe((c.root_pc + (c.quality === 'major' ? 4 : 3)) % 12);
          expect(pitchOf(fifth)).toBe((c.root_pc + 7) % 12);
        }
      }
    }
  });
});

describe('nearestShape', () => {
  // Invariant 3
  it('picks the drill position closest to the anchor, the lower one on a tie', () => {
    for (let root = 0; root < 12; root++) {
      for (const quality of ['major', 'minor'] as const) {
        for (let stringSet = 0; stringSet < 4; stringSet++) {
          const item = { root_pc: root, quality, string_set: stringSet };
          const { positions } = buildDrill(item, ALL_INVERSIONS);

          for (let anchor = 0; anchor <= MAX_FRET; anchor++) {
            const picked = nearestShape(chord(root, quality), stringSet, anchor);
            const label = `${root} ${quality} set ${stringSet} anchor ${anchor}`;

            expect(positions.map((p) => p.frets), label).toContainEqual(picked.frets);
            for (const other of positions) {
              const pickedDistance = Math.abs(centre(picked) - anchor);
              const otherDistance = Math.abs(centre(other) - anchor);
              expect(otherDistance, label).toBeGreaterThanOrEqual(pickedDistance);
              if (otherDistance === pickedDistance) {
                expect(centre(picked), label).toBeLessThanOrEqual(centre(other));
              }
            }
          }
        }
      }
    }
  });
});

describe('accompanimentVoicing', () => {
  // Invariant 4
  it('plays only chord tones, the root in the bass, all of it below middle C', () => {
    for (let root = 0; root < 12; root++) {
      for (const quality of ['major', 'minor'] as const) {
        const { bass, chord: notes } = accompanimentVoicing(chord(root, quality));
        const tones = [root, (root + (quality === 'major' ? 4 : 3)) % 12, (root + 7) % 12];

        expect(bass % 12).toBe(root);
        expect(bass).toBeGreaterThanOrEqual(BASS_LOW);
        expect(bass).toBeLessThan(CHORD_LOW);
        expect(notes.map((n) => n % 12).sort()).toEqual([...tones].sort());
        for (const note of notes) {
          expect(note).toBeGreaterThanOrEqual(CHORD_LOW);
          expect(note).toBeLessThan(60);
        }
      }
    }
  });
});

describe('timeline', () => {
  // Invariant 5
  it('lasts four beats a bar and changes chord on the first beat of each one', () => {
    for (const progression of PROGRESSIONS) {
      const chords = chordsInKey(progression, 0);
      const { beats, events } = timeline(chords);
      const totalBars = chords.reduce((sum, c) => sum + c.bars, 0);

      expect(beats, progression.id).toBe(4 * totalBars);

      let start = 0;
      const expectedChanges = chords.map((c, chordIndex) => {
        const change = { beat: start, chordIndex };
        start += c.bars * 4;
        return change;
      });
      const changes = events
        .filter((e) => e.kind === 'change')
        .map((e) => ({ beat: e.beat, chordIndex: e.kind === 'change' ? e.chordIndex : -1 }));
      expect(changes, progression.id).toEqual(expectedChanges);

      // Something sounds on every beat, and never twice.
      const sounding = events.filter((e) => e.kind !== 'change').map((e) => e.beat);
      expect(sounding, progression.id).toEqual(Array.from({ length: beats }, (_, i) => i));
    }
  });

  it('runs the twelve-bar blues to forty-eight beats', () => {
    expect(timeline(chordsInKey(findProgression('blues'), 9)).beats).toBe(48);
  });
});
