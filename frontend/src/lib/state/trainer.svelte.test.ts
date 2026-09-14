import { describe, expect, it } from 'vitest';
import { Trainer, withCompDefaults } from './trainer.svelte';

/** Settings as a backend from before comping sends them. */
const oldSettings = {
  qualities: ['major' as const],
  sets: [2],
  inversions: ['root' as const, 'first' as const, 'second' as const],
  roots: [0, 1, 2],
  bpm: 60,
  show_labels: true
};

describe('withCompDefaults', () => {
  // Invariant 11
  it('fills in every comping field an older backend leaves out', () => {
    expect(withCompDefaults(oldSettings)).toEqual({
      ...oldSettings,
      mode: 'drill',
      comp_key: 7,
      comp_progression: 'I-V-vi-IV',
      comp_string_set: 2,
      comp_instrument: 'piano',
      comp_bpm: 80
    });
  });

  it('keeps comping fields the backend did send', () => {
    const saved = withCompDefaults({ ...oldSettings, mode: 'comp', comp_key: 5 });
    expect(saved.mode).toBe('comp');
    expect(saved.comp_key).toBe(5);
  });
});

describe('Trainer mode', () => {
  // Invariant 11
  it('switches to comping with a full progression when the backend sent no comping fields', () => {
    const trainer = new Trainer();
    trainer.settings = withCompDefaults(oldSettings);

    trainer.setMode('comp');

    expect(trainer.settings?.mode).toBe('comp');
    expect(Object.keys(trainer.settings!)).toContain('mode');
    expect(trainer.compChords.map((chord) => chord.name)).toEqual(['G', 'D', 'Em', 'C']);
  });
});
