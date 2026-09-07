/**
 * The app's single source of truth. Owns the settings, the drill on screen and
 * the practice stats, and keeps all three in step with the backend.
 *
 * A drill is one chord on one string set. Its positions run from the lowest
 * playable spot on the neck to the highest, and the metronome walks them a bar
 * at a time, wrapping back to the bottom, until you stop it.
 */
import { ApiError, api } from '../api';
import { SHOW_INVERSION_PICKER, SHOW_ROOT_PICKER } from '../config';
import { ALL_INVERSIONS, ALL_ROOTS, buildDrill } from '../music';
import type { Drill, PracticeStats, Quality, Settings, TriadItem } from '../types';
import type { Inversion } from '../types';

const SAVE_DEBOUNCE_MS = 300;

/** Only name the filters you can actually see and change. */
const NOTHING_SELECTED = (() => {
  const parts = ['quality', 'string set'];
  if (SHOW_INVERSION_PICKER) parts.push('inversion');
  if (SHOW_ROOT_PICKER) parts.push('key');
  const last = parts.pop();
  return `Tick at least one ${parts.join(', ')} and ${last} above.`;
})();

export class Trainer {
  settings = $state<Settings | null>(null);
  drill = $state<Drill | null>(null);
  /** Which position of the drill is showing. */
  positionIndex = $state(0);
  stats = $state<PracticeStats | null>(null);
  showLabels = $state(true);
  /** Non-empty when the user needs telling something (no matches, save failed). */
  notice = $state('');
  loading = $state(true);

  shape = $derived(this.drill?.positions[this.positionIndex] ?? null);
  positionCount = $derived(this.drill?.positions.length ?? 0);

  /** Shapes played but not yet sent. Flushed a lap at a time, not a bar at a time. */
  #unlogged: TriadItem[] = [];
  #saveTimer: ReturnType<typeof setTimeout> | null = null;

  async load() {
    try {
      const [settings, stats] = await Promise.all([api.getSettings(), api.getStats()]);
      this.settings = settings;
      this.showLabels = settings.show_labels;
      this.stats = stats;
      this.#openHiddenChoices();
    } catch {
      this.notice = 'Could not reach the backend — is it running on port 8000?';
      return;
    } finally {
      this.loading = false;
    }

    // The drill block holds the only "New drill" button, so land on a drill
    // rather than an empty section with no way out.
    await this.nextDrill();
  }

  async nextDrill() {
    await this.#flush();
    try {
      const item = await api.nextDrill();
      this.drill = buildDrill(item, this.settings?.inversions ?? []);
      this.positionIndex = 0;
      this.notice = this.drill.positions.length ? '' : NOTHING_SELECTED;
    } catch (error) {
      this.drill = null;
      this.notice =
        error instanceof ApiError && error.status === 409
          ? NOTHING_SELECTED
          : 'Could not fetch the next drill.';
    }
  }

  /** Called on each bar line: bank the shape just played and move up the neck. */
  advance() {
    const played = this.shape;
    if (!played || !this.drill) return;

    this.#unlogged.push(played.item);
    this.positionIndex = (this.positionIndex + 1) % this.drill.positions.length;

    // Back at the bottom means a full lap, so send it.
    if (this.positionIndex === 0) void this.#flush();
  }

  /**
   * Jump straight to a position. This is for looking, not playing, so nothing
   * is logged; only the metronome's own steps count as practice.
   */
  showPosition(index: number) {
    if (!this.drill || index < 0 || index >= this.drill.positions.length) return;
    this.positionIndex = index;
  }

  /** Step to the next position and wrap. Browsing, so nothing is logged. */
  nextPosition() {
    if (!this.drill || this.drill.positions.length === 0) return;
    this.positionIndex = (this.positionIndex + 1) % this.drill.positions.length;
  }

  /** Counting has restarted, so begin again at the lowest position. */
  restartCycle() {
    this.positionIndex = 0;
  }

  /** Counting has stopped mid-lap; keep what was played. */
  flushPlayed() {
    void this.#flush();
  }

  /** Done: bank the shape on screen along with the rest, then move on. */
  async logAndAdvance() {
    if (this.shape) this.#unlogged.push(this.shape.item);
    await this.nextDrill();
  }

  async clearLog() {
    await api.clearLog();
    this.stats = await api.getStats();
  }

  toggleQuality = (value: Quality, on: boolean) => this.#toggle('qualities', value, on);
  toggleSet = (value: number, on: boolean) => this.#toggle('sets', value, on);
  toggleInversion = (value: Inversion, on: boolean) => this.#toggle('inversions', value, on);
  toggleRoot = (value: number, on: boolean) => this.#toggle('roots', value, on);

  setBpm(bpm: number) {
    if (!this.settings) return;
    this.settings.bpm = bpm;
    this.#scheduleSave();
  }

  setShowLabels(on: boolean) {
    this.showLabels = on;
    if (!this.settings) return;
    this.settings.show_labels = on;
    this.#scheduleSave();
  }

  /**
   * A hidden picker cannot switch its options back on, so a stored subset would
   * quietly stick forever. Widen anything that is off screen back out on load.
   */
  #openHiddenChoices() {
    if (!this.settings) return;
    let widened = false;

    if (!SHOW_ROOT_PICKER && this.settings.roots.length !== ALL_ROOTS.length) {
      this.settings.roots = [...ALL_ROOTS];
      widened = true;
    }
    if (!SHOW_INVERSION_PICKER && this.settings.inversions.length !== ALL_INVERSIONS.length) {
      this.settings.inversions = [...ALL_INVERSIONS];
      widened = true;
    }

    if (widened) this.#scheduleSave();
  }

  async #flush() {
    if (this.#unlogged.length === 0) return;
    const batch = this.#unlogged;
    this.#unlogged = [];
    try {
      await api.logShapes(batch);
      this.stats = await api.getStats();
    } catch {
      this.notice = 'Could not save that lap — the log may be out of date.';
    }
  }

  #toggle<K extends 'qualities' | 'sets' | 'inversions' | 'roots'>(
    key: K,
    value: Settings[K][number],
    on: boolean
  ) {
    if (!this.settings) return;
    const current = this.settings[key] as Settings[K][number][];
    this.settings[key] = (
      on ? [...current, value] : current.filter((v) => v !== value)
    ) as Settings[K];
    this.#scheduleSave();

    // The enabled inversions are the drill's steps, so it has to be rebuilt.
    if (key === 'inversions' && this.drill) {
      this.drill = buildDrill(this.drill.item, this.settings.inversions);
      this.positionIndex = 0;
    }
  }

  /** Checkboxes fire in bursts, so coalesce them into one PUT. */
  #scheduleSave() {
    if (this.#saveTimer) clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => void this.#save(), SAVE_DEBOUNCE_MS);
  }

  async #save() {
    if (!this.settings) return;
    try {
      await api.saveSettings($state.snapshot(this.settings));
      if (this.notice !== NOTHING_SELECTED) this.notice = '';
    } catch {
      this.notice = 'Could not save settings — changes may not persist.';
    }
  }
}

export const trainer = new Trainer();
