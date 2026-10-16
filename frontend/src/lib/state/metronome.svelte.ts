/** Three-beat metronome, one beat per note of the triad. */
import { audioContext, playClick } from '../audio';

const BEATS = 3;

export class Metronome {
  running = $state(false);
  /** Which of the three notes is being called, or -1 when stopped. */
  beat = $state(-1);

  readonly beats = BEATS;

  #timer: ReturnType<typeof setInterval> | null = null;
  #bpm = 60;

  start(bpm: number) {
    this.#clearTimer();
    this.#bpm = bpm;
    this.running = true;
    this.beat = -1;
    this.#tick();
    this.#timer = setInterval(() => this.#tick(), 60_000 / bpm);
  }

  stop() {
    if (!this.running) return;
    this.#clearTimer();
    this.running = false;
    this.beat = -1;
  }

  toggle(bpm: number) {
    if (this.running) this.stop();
    else this.start(bpm);
  }

  /** Restart on the new tempo, but only if we are already counting. */
  retempo(bpm: number) {
    if (this.running && bpm !== this.#bpm) this.start(bpm);
  }

  #clearTimer() {
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = null;
  }

  #tick() {
    this.beat = (this.beat + 1) % BEATS;
    const ctx = audioContext();
    playClick(ctx, ctx.currentTime, this.beat === 0);
  }
}
