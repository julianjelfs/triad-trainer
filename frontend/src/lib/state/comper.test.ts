import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NoteStart } from '../audio';
import { ZONE_ANCHORS, chordsInKey, findProgression, type Progression } from '../harmony';
import { COUNT_IN_BEATS, Comper, START_DELAY_S, type ComperAudio } from './comper.svelte';

/**
 * Audio with no speakers. The clock is the faked system time, so advancing
 * the fake timers moves the audio clock in step with the scheduler.
 */
function fakeAudio(beforeLoad: () => Promise<void> = async () => {}) {
  const starts: NoteStart[] = [];
  const clicks: number[] = [];
  const counts = { stopped: 0 };
  const audio: ComperAudio = {
    context: () => ({
      get currentTime() {
        return Date.now() / 1000;
      }
    }),
    load: async () => {
      await beforeLoad();
      return {
        start: (note) => void starts.push(note),
        stop: () => void (counts.stopped += 1)
      };
    },
    click: (time) => void clicks.push(time)
  };
  return { audio, starts, clicks, counts };
}

/** Distinct audio times at which a note was started, earliest first. */
function noteTimes(starts: NoteStart[]): number[] {
  return [...new Set(starts.map((s) => s.time))].sort((a, b) => a - b);
}

const pop = chordsInKey(findProgression('I-V-vi-IV'), 7);

const oneBar: Progression = {
  id: 'one-bar',
  name: 'I',
  tonality: 'major',
  chords: [{ degree: 0, quality: 'major', bars: 1 }]
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Comper', () => {
  // Invariant 6
  it('sounds beat n at start + n × 60/bpm, with no drift after ten minutes', async () => {
    const { audio, starts, clicks } = fakeAudio();
    const comper = new Comper(audio);
    const bpm = 97;
    const secondsPerBeat = 60 / bpm;

    await comper.start({ chords: pop, bpm, instrument: 'piano' });
    vi.advanceTimersByTime(10 * 60_000);
    comper.stop();

    clicks.forEach((time, n) => expect(time).toBeCloseTo(START_DELAY_S + n * secondsPerBeat, 9));
    expect(clicks).toHaveLength(COUNT_IN_BEATS);

    const beats = noteTimes(starts).map((time) => (time - START_DELAY_S) / secondsPerBeat);
    for (const beat of beats) expect(Math.abs(beat - Math.round(beat))).toBeLessThan(1e-9);

    const whole = beats.map(Math.round);
    expect(whole[0]).toBe(COUNT_IN_BEATS);
    expect(whole).toEqual(Array.from({ length: whole.length }, (_, i) => COUNT_IN_BEATS + i));
    expect(whole.length).toBeGreaterThan(960);
  });

  it('keeps its place when the tempo changes mid-run', async () => {
    const { audio, starts } = fakeAudio();
    const comper = new Comper(audio);

    await comper.start({ chords: pop, bpm: 60, instrument: 'piano' });
    vi.advanceTimersByTime(10_000);
    comper.retempo(120);
    vi.advanceTimersByTime(10_000);
    comper.stop();

    const gaps = noteTimes(starts)
      .slice(1)
      .map((time, i, rest) => time - (i === 0 ? noteTimes(starts)[0] : rest[i - 1]));
    const firstFast = gaps.findIndex((gap) => Math.abs(gap - 0.5) < 1e-9);

    expect(firstFast).toBeGreaterThan(0);
    gaps.slice(0, firstFast).forEach((gap) => expect(gap).toBeCloseTo(1, 9));
    gaps.slice(firstFast).forEach((gap) => expect(gap).toBeCloseTo(0.5, 9));
  });

  // Invariant 7
  it('climbs one zone each time round the progression and wraps at the top', async () => {
    const { audio } = fakeAudio();
    const comper = new Comper(audio);

    // One bar at 60 bpm: a loop every four seconds, the first chord at 4.1s.
    await comper.start({ chords: chordsInKey(oneBar, 0), bpm: 60, instrument: 'piano' });

    vi.advanceTimersByTime(3_000);
    expect(comper.countingIn).toBe(true);
    expect(comper.zoneIndex).toBe(0);

    vi.advanceTimersByTime(1_150);
    expect(comper.countingIn).toBe(false);
    expect(comper.zoneIndex).toBe(0);

    for (let loop = 1; loop <= ZONE_ANCHORS.length * 2; loop++) {
      vi.advanceTimersByTime(4_000);
      expect(comper.loop).toBe(loop);
      expect(comper.zoneIndex).toBe(loop % ZONE_ANCHORS.length);
    }
  });

  it('shows each chord of the progression as its bar comes round', async () => {
    const { audio } = fakeAudio();
    const comper = new Comper(audio);
    await comper.start({ chords: pop, bpm: 60, instrument: 'piano' });

    const seen: number[] = [];
    vi.advanceTimersByTime(4_150);
    for (let bar = 0; bar < 5; bar++) {
      seen.push(comper.chordIndex);
      vi.advanceTimersByTime(4_000);
    }
    expect(seen).toEqual([0, 1, 2, 3, 0]);
  });

  // Invariant 8
  it('goes quiet and still once stopped', async () => {
    const { audio, starts, clicks, counts } = fakeAudio();
    const comper = new Comper(audio);

    await comper.start({ chords: pop, bpm: 90, instrument: 'guitar' });
    vi.advanceTimersByTime(7_000);
    comper.stop();

    const before = {
      starts: starts.length,
      clicks: clicks.length,
      chordIndex: comper.chordIndex,
      loop: comper.loop
    };
    vi.advanceTimersByTime(30_000);

    expect({
      starts: starts.length,
      clicks: clicks.length,
      chordIndex: comper.chordIndex,
      loop: comper.loop
    }).toEqual(before);
    expect(comper.beat).toBe(-1);
    expect(comper.running).toBe(false);
    expect(counts.stopped).toBe(1);
  });

  // Invariant 8
  it('never starts if stopped while the samples are still loading', async () => {
    let finishLoading = () => {};
    const { audio, starts, clicks } = fakeAudio(
      () => new Promise<void>((resolve) => (finishLoading = resolve))
    );
    const comper = new Comper(audio);

    const starting = comper.start({ chords: pop, bpm: 90, instrument: 'piano' });
    await Promise.resolve();
    expect(comper.loading).toBe(true);

    comper.stop();
    finishLoading();
    await starting;
    vi.advanceTimersByTime(10_000);

    expect(comper.running).toBe(false);
    expect(comper.loading).toBe(false);
    expect(starts).toHaveLength(0);
    expect(clicks).toHaveLength(0);
  });

  it('says so when the samples cannot be fetched', async () => {
    const comper = new Comper({
      ...fakeAudio().audio,
      load: () => Promise.reject(new Error('offline'))
    });

    await comper.start({ chords: pop, bpm: 90, instrument: 'guitar' });

    expect(comper.running).toBe(false);
    expect(comper.loading).toBe(false);
    expect(comper.error).toMatch(/guitar samples/);
  });
});
