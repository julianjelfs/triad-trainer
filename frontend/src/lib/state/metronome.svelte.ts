/** Three-beat metronome — one beat per note of the triad, one bar per shape. */

const BEATS = 3;
const ACCENT_HZ = 1100;
const BEAT_HZ = 800;
const CLICK_GAIN = 0.15;
const CLICK_SECONDS = 0.08;

export interface MetronomeHandlers {
  /** Counting has begun; the drill should go back to its lowest position. */
  onStart?: () => void;
  /** A bar has finished. Fires on beat 1 of every bar except the first. */
  onBar?: () => void;
  onStop?: () => void;
}

export class Metronome {
  running = $state(false);
  /** Which of the three notes is being called, or -1 when stopped. */
  beat = $state(-1);

  readonly beats = BEATS;

  #timer: ReturnType<typeof setInterval> | null = null;
  #audio: AudioContext | null = null;
  #bpm = 60;
  #barsStarted = 0;

  constructor(private handlers: MetronomeHandlers = {}) {}

  start(bpm: number) {
    this.#clearTimer();
    this.#bpm = bpm;
    this.running = true;
    this.beat = -1;
    this.#barsStarted = 0;
    this.handlers.onStart?.();
    this.#tick();
    this.#timer = setInterval(() => this.#tick(), 60_000 / bpm);
  }

  stop() {
    if (!this.running) return;
    this.#clearTimer();
    this.running = false;
    this.beat = -1;
    this.handlers.onStop?.();
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
    if (this.beat === 0) {
      if (this.#barsStarted > 0) this.handlers.onBar?.();
      this.#barsStarted += 1;
    }
    this.#click(this.beat === 0);
  }

  #click(accented: boolean) {
    const ctx = (this.#audio ??= new AudioContext());
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.frequency.value = accented ? ACCENT_HZ : BEAT_HZ;
    gain.gain.value = CLICK_GAIN;
    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + CLICK_SECONDS);
    oscillator.stop(ctx.currentTime + CLICK_SECONDS + 0.01);
  }
}
