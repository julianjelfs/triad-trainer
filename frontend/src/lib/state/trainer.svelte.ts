/**
 * The app's single source of truth: the settings, kept in step with the
 * backend. Everything on screen is worked out from them.
 *
 * A copy lives on the device too, so the app opens and remembers its choices
 * when the Pi can't be reached. Changes made then are marked unsent and go to
 * the Pi the next time it answers. One player, so the latest change wins.
 */
import { api as piApi, type Api } from '../api';
import { chordSpelling, chordsInKey, findProgression } from '../harmony';
import { chordShapes } from '../music';
import type { Mode, Settings } from '../types';

const SAVE_DEBOUNCE_MS = 300;

const STORAGE_KEY = 'triads.settings';

/** What a fresh install starts from, matching the backend's defaults. */
export const DEFAULT_SETTINGS: Settings = {
  learn_key: 0,
  learn_quality: 'major',
  learn_string_set: 2,
  bpm: 60,
  show_labels: true,
  mode: 'learn',
  comp_key: 7,
  comp_progression: 'I-V-vi-IV',
  comp_string_set: 2,
  comp_instrument: 'piano',
  comp_bpm: 80
};

const OFFLINE_NOTICE = "Can't reach the Pi, so changes are kept on this device for now.";

interface Stored {
  settings: Settings;
  /** Changed here since the Pi last took a copy. */
  unsent: boolean;
}

/** Where the device copy lives. localStorage in the browser; a fake in tests. */
export interface SettingsStore {
  read(): Stored | null;
  write(stored: Stored): void;
}

/** localStorage, which a private window or a full disk can refuse. */
const browserStore: SettingsStore = {
  read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Stored) : null;
    } catch {
      return null;
    }
  },
  write(stored) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Nothing to do: the Pi still has a copy whenever it can be reached.
    }
  }
};

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

  constructor(
    private api: Api = piApi,
    private store: SettingsStore = browserStore
  ) {}

  async load() {
    const local = this.store.read();
    try {
      const remote = await this.api.getSettings();
      if (local?.unsent) {
        // Changed here while the Pi was out of reach: those are the newer ones.
        this.#use(local.settings);
        await this.#save();
      } else {
        this.#use(remote);
        this.store.write({ settings: remote, unsent: false });
      }
    } catch {
      this.#use({ ...DEFAULT_SETTINGS, ...local?.settings });
      this.notice = OFFLINE_NOTICE;
    } finally {
      this.loading = false;
    }
  }

  #use(settings: Settings) {
    this.settings = settings;
    this.showLabels = settings.show_labels;
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

  /**
   * Kept on the device at once, so nothing is lost if the Pi is unreachable.
   * Taps come in bursts, so the PUT is coalesced.
   */
  #scheduleSave() {
    if (this.settings) {
      this.store.write({ settings: $state.snapshot(this.settings), unsent: true });
    }
    if (this.#saveTimer) clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => void this.#save(), SAVE_DEBOUNCE_MS);
  }

  async #save() {
    if (!this.settings) return;
    const settings = $state.snapshot(this.settings);
    try {
      await this.api.saveSettings(settings);
      this.store.write({ settings, unsent: false });
      this.notice = '';
    } catch {
      this.notice = OFFLINE_NOTICE;
    }
  }
}

export const trainer = new Trainer();
