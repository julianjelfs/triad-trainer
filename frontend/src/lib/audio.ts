/**
 * Web Audio shared by the drill's metronome and the comping backing. One
 * context for the whole page, created on first use, because browsers only let
 * it make sound once the reader has clicked something.
 */
import type { CompInstrument } from './types';

const ACCENT_HZ = 1100;
const BEAT_HZ = 800;
const CLICK_GAIN = 0.15;
const CLICK_SECONDS = 0.08;

export interface NoteStart {
  /** MIDI note number. */
  note: number;
  /** When to play, on the audio context's clock. */
  time: number;
  duration: number;
  velocity: number;
}

/** The part of a sampled instrument the backing uses. */
export interface BackingInstrument {
  start(note: NoteStart): void;
  stop(): void;
}

let shared: AudioContext | null = null;

export function audioContext(): AudioContext {
  return (shared ??= new AudioContext());
}

/** A short blip at `time`, higher on the first beat of the bar. */
export function playClick(ctx: BaseAudioContext, time: number, accented: boolean) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.frequency.value = accented ? ACCENT_HZ : BEAT_HZ;
  gain.gain.setValueAtTime(CLICK_GAIN, time);
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + CLICK_SECONDS);
  oscillator.stop(time + CLICK_SECONDS + 0.01);
}

const loaded = new Map<CompInstrument, Promise<BackingInstrument>>();

/**
 * Fetch an instrument's samples once per page. smplr is imported here rather
 * than at the top so the drill never downloads it, and the samples stream from
 * smplr's CDN, so the first load needs a connection.
 */
export function loadInstrument(ctx: AudioContext, kind: CompInstrument): Promise<BackingInstrument> {
  let pending = loaded.get(kind);
  if (!pending) {
    pending = (async () => {
      const { SplendidGrandPiano, Soundfont } = await import('smplr');
      const instrument =
        kind === 'piano'
          ? SplendidGrandPiano(ctx)
          : Soundfont(ctx, { instrument: 'acoustic_guitar_steel' });
      await instrument.ready;
      return {
        start: (note: NoteStart) => void instrument.start(note),
        stop: () => instrument.stop()
      };
    })();
    // A failed download should be retried next time, not remembered.
    pending.catch(() => loaded.delete(kind));
    loaded.set(kind, pending);
  }
  return pending;
}
