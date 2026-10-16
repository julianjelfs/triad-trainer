/**
 * The app's single source of truth: the settings, kept in step with the
 * backend. Everything on screen is worked out from them.
 */
import { api } from '../api';
import { chordSpelling, chordsInKey, findProgression } from '../harmony';
import { chordShapes } from '../music';
import type { Mode, Settings } from '../types';

const SAVE_DEBOUNCE_MS = 300;

type Patch = Partial<Omit<Settings, 'show_labels'>>;

export class Trainer {
  settings = $state<Settings | null>(null);
  showLabels = $state(true);
  /** Non-empty when the user needs telling something (save failed). */
  notice = $state('');
  loading = $state(true);

  /** Every shape of the chord learning mode is showing. */
  learnShapes = $derived(
    this.settings
      ? chordShapes({
          root_pc: this.settings.learn_key,
          quality: this.settings.learn_quality,
          string_set: this.settings.learn_string_set
        })
      : []
  );

  learnSpelling = $derived(
    this.settings ? chordSpelling(this.settings.learn_key, this.settings.learn_quality) : null
  );

  /** The comping progression, worked out in the chosen key. */
  compChords = $derived(
    this.settings
      ? chordsInKey(findProgression(this.settings.comp_progression), this.settings.comp_key)
      : []
  );

  #saveTimer: ReturnType<typeof setTimeout> | null = null;

  async load() {
    try {
      this.settings = await api.getSettings();
      this.showLabels = this.settings.show_labels;
    } catch {
      this.notice = 'Could not reach the backend. Is it running on port 8000?';
    } finally {
      this.loading = false;
    }
  }

  setMode(mode: Mode) {
    this.set({ mode });
  }

  /** Every choice is a single value, so a change replaces rather than toggles. */
  set(patch: Patch) {
    if (!this.settings) return;
    Object.assign(this.settings, patch);
    this.#scheduleSave();
  }

  setShowLabels(on: boolean) {
    this.showLabels = on;
    if (!this.settings) return;
    this.settings.show_labels = on;
    this.#scheduleSave();
  }

  /** Taps come in bursts, so coalesce them into one PUT. */
  #scheduleSave() {
    if (this.#saveTimer) clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => void this.#save(), SAVE_DEBOUNCE_MS);
  }

  async #save() {
    if (!this.settings) return;
    try {
      await api.saveSettings($state.snapshot(this.settings));
      this.notice = '';
    } catch {
      this.notice = 'Could not save settings. Changes may not persist.';
    }
  }
}

export const trainer = new Trainer();
