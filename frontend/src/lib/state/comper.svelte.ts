/**
 * Plays a progression round and round for you to comp over.
 *
 * Unlike the drill's metronome, nothing here is timed by `setInterval` alone.
 * A short interval looks a tenth of a second ahead and books every note that
 * falls inside that window on the audio clock, so beats land where the
 * arithmetic says they should however long it runs. The screen follows the
 * audio, updated by a timeout aimed at each beat's audio time.
 */
import {
  audioContext,
  loadInstrument,
  playClick,
  type BackingInstrument
} from '../audio';
import { BEATS_PER_BAR, ZONE_ANCHORS, timeline, type CompEvent, type KeyChord } from '../harmony';
import type { CompInstrument } from '../types';

/** One bar of clicks before the first chord. */
export const COUNT_IN_BEATS = BEATS_PER_BAR;
/** Gap between pressing Start and the first click, so it is never clipped. */
export const START_DELAY_S = 0.1;

const LOOK_AHEAD_S = 0.1;
const PUMP_MS = 25;
/** Gap between a strummed chord's notes. The piano plays them together. */
const STRUM_S = 0.012;
const BASS_VELOCITY = 80;
const STAB_VELOCITY = 60;

/** Everything the comper needs from the browser, so tests can supply a fake clock. */
export interface ComperAudio {
  context(): { readonly currentTime: number; resume?: () => Promise<void> };
  load(kind: CompInstrument): Promise<BackingInstrument>;
  click(time: number, accented: boolean): void;
}

const browserAudio: ComperAudio = {
  context: audioContext,
  load: (kind) => loadInstrument(audioContext(), kind),
  click: (time, accented) => playClick(audioContext(), time, accented)
};

export interface CompPlan {
  chords: KeyChord[];
  bpm: number;
  instrument: CompInstrument;
}

export class Comper {
  running = $state(false);
  /** Waiting for samples to download. */
  loading = $state(false);
  error = $state('');
  /** Beat within the bar, or -1 when stopped. */
  beat = $state(-1);
  countingIn = $state(false);
  chordIndex = $state(0);
  /** How many full times round the progression since Start. */
  loop = $state(0);
  /** Which of the fret zones this loop is played around. */
  zoneIndex = $derived(this.loop % ZONE_ANCHORS.length);

  #instrument: BackingInstrument | null = null;
  #strum = 0;
  #loopBeats = 0;
  #eventsAt: CompEvent[][] = [];
  #chordAt: number[] = [];

  // Beat n sounds at #anchorTime + (n - #anchorBeat) × #secondsPerBeat. Only a
  // tempo change moves the anchor, so no beat inherits the rounding of the one
  // before it.
  #anchorBeat = 0;
  #anchorTime = 0;
  #secondsPerBeat = 1;
  #nextBeat = 0;

  #pump: ReturnType<typeof setInterval> | null = null;
  #pending = new Set<ReturnType<typeof setTimeout>>();
  /** Bumped by every start and stop, so a load that finishes late can tell it is stale. */
  #session = 0;

  constructor(private audio: ComperAudio = browserAudio) {}

  async start(plan: CompPlan) {
    this.stop();
    const session = ++this.#session;
    this.error = '';
    this.loading = true;

    let instrument: BackingInstrument;
    try {
      await this.audio.context().resume?.();
      instrument = await this.audio.load(plan.instrument);
    } catch {
      if (session === this.#session) {
        this.loading = false;
        this.error = `Could not load the ${plan.instrument} samples. They download the first time, so check the connection.`;
      }
      return;
    }
    if (session !== this.#session) return;

    const { beats, events } = timeline(plan.chords);
    this.#instrument = instrument;
    this.#strum = plan.instrument === 'guitar' ? STRUM_S : 0;
    this.#loopBeats = beats;
    this.#eventsAt = Array.from({ length: beats }, () => []);
    this.#chordAt = new Array(beats).fill(0);
    for (const event of events) {
      this.#eventsAt[event.beat].push(event);
      if (event.kind === 'change') this.#chordAt.fill(event.chordIndex, event.beat);
    }

    this.#anchorBeat = 0;
    this.#anchorTime = this.audio.context().currentTime + START_DELAY_S;
    this.#secondsPerBeat = 60 / plan.bpm;
    this.#nextBeat = 0;

    this.loading = false;
    this.running = true;
    this.countingIn = true;
    this.beat = -1;
    this.chordIndex = 0;
    this.loop = 0;

    this.#schedule();
    this.#pump = setInterval(() => this.#schedule(), PUMP_MS);
  }

  stop() {
    this.#session += 1;
    this.loading = false;
    if (!this.running) return;

    if (this.#pump) clearInterval(this.#pump);
    this.#pump = null;
    for (const timeout of this.#pending) clearTimeout(timeout);
    this.#pending.clear();
    this.#instrument?.stop();

    this.running = false;
    this.countingIn = false;
    this.beat = -1;
  }

  /** Carry on from the next unbooked beat at the new tempo, without a restart. */
  retempo(bpm: number) {
    const secondsPerBeat = 60 / bpm;
    if (!this.running || secondsPerBeat === this.#secondsPerBeat) return;
    this.#anchorTime = this.#timeOf(this.#nextBeat);
    this.#anchorBeat = this.#nextBeat;
    this.#secondsPerBeat = secondsPerBeat;
  }

  #timeOf(beat: number): number {
    return this.#anchorTime + (beat - this.#anchorBeat) * this.#secondsPerBeat;
  }

  #schedule() {
    const horizon = this.audio.context().currentTime + LOOK_AHEAD_S;
    while (this.#timeOf(this.#nextBeat) < horizon) {
      this.#book(this.#nextBeat, this.#timeOf(this.#nextBeat));
      this.#nextBeat += 1;
    }
  }

  #book(beat: number, time: number) {
    if (beat < COUNT_IN_BEATS) {
      this.audio.click(time, beat === 0);
      this.#at(time, () => {
        this.countingIn = true;
        this.beat = beat;
      });
      return;
    }

    const played = beat - COUNT_IN_BEATS;
    const loopBeat = played % this.#loopBeats;
    const loop = Math.floor(played / this.#loopBeats);
    const duration = (beats: number) => beats * this.#secondsPerBeat;

    for (const event of this.#eventsAt[loopBeat]) {
      if (event.kind === 'bass') {
        this.#instrument!.start({
          note: event.note,
          time,
          duration: duration(event.beats),
          velocity: BASS_VELOCITY
        });
      } else if (event.kind === 'stab') {
        event.notes.forEach((note, index) =>
          this.#instrument!.start({
            note,
            time: time + index * this.#strum,
            duration: duration(event.beats),
            velocity: STAB_VELOCITY
          })
        );
      }
    }

    const chordIndex = this.#chordAt[loopBeat];
    this.#at(time, () => {
      this.countingIn = false;
      this.beat = loopBeat % BEATS_PER_BAR;
      this.chordIndex = chordIndex;
      this.loop = loop;
    });
  }

  #at(time: number, update: () => void) {
    const delay = Math.max(0, (time - this.audio.context().currentTime) * 1000);
    const timeout = setTimeout(() => {
      this.#pending.delete(timeout);
      update();
    }, delay);
    this.#pending.add(timeout);
  }
}
