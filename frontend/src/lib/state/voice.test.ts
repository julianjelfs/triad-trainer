import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VoiceCommands } from './voice.svelte';

/** Stands in for the browser's SpeechRecognition so no microphone is involved. */
class FakeRecognition {
  static last: FakeRecognition | null = null;

  continuous = false;
  interimResults = false;
  lang = '';
  started = 0;
  aborted = 0;

  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;

  constructor() {
    FakeRecognition.last = this;
  }

  start() {
    this.started += 1;
  }

  stop() {}

  abort() {
    this.aborted += 1;
  }

  /** Feed transcripts as one recognition event, as Chrome does. */
  say(transcripts: string[], resultIndex = 0) {
    this.onresult?.({
      resultIndex,
      results: Object.assign(
        transcripts.map((transcript) => [{ transcript }]),
        { length: transcripts.length }
      )
    });
  }
}

function install() {
  (globalThis as { window?: unknown }).window = { SpeechRecognition: FakeRecognition };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-07T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as { window?: unknown }).window;
  FakeRecognition.last = null;
});

describe('VoiceCommands', () => {
  it('reports when the browser has no speech recognition', () => {
    (globalThis as { window?: unknown }).window = {};
    expect(new VoiceCommands(() => {}).supported).toBe(false);
  });

  it('fires on "next" and ignores everything else', () => {
    install();
    const onCommand = vi.fn();
    const voice = new VoiceCommands(onCommand);
    voice.start();

    FakeRecognition.last!.say(['hold on']);
    expect(onCommand).not.toHaveBeenCalled();

    // Results accumulate; resultIndex points at the newly heard one.
    FakeRecognition.last!.say(['hold on', 'next'], 1);
    expect(onCommand).toHaveBeenCalledTimes(1);
  });

  it('fires once per utterance as the interim result firms up', () => {
    install();
    const onCommand = vi.fn();
    const voice = new VoiceCommands(onCommand);
    voice.start();

    // Chrome re-sends the same result index as it grows more confident.
    FakeRecognition.last!.say(['next']);
    FakeRecognition.last!.say(['next']);
    FakeRecognition.last!.say([' next ']);

    expect(onCommand).toHaveBeenCalledTimes(1);
  });

  it('does not match "next" inside a longer word', () => {
    install();
    const onCommand = vi.fn();
    new VoiceCommands(onCommand).start();

    FakeRecognition.last!.say(['nextdoor neighbour']);
    expect(onCommand).not.toHaveBeenCalled();
  });

  it('picks itself back up when Chrome ends the session on its own', () => {
    install();
    const voice = new VoiceCommands(() => {});
    voice.start();
    const recognition = FakeRecognition.last!;
    expect(recognition.started).toBe(1);

    recognition.onend?.();
    expect(recognition.started).toBe(2);
    expect(voice.listening).toBe(true);
  });

  it('stays stopped once stopped', () => {
    install();
    const voice = new VoiceCommands(() => {});
    voice.start();
    const recognition = FakeRecognition.last!;

    voice.stop();
    recognition.onend?.();

    expect(recognition.started).toBe(1);
    expect(recognition.aborted).toBe(1);
    expect(voice.listening).toBe(false);
  });

  it('fires once when a session ends between the interim and final result', () => {
    // Android Chrome ignores `continuous`, so it ends the session after every
    // utterance and the final result lands in a fresh session at index 0. An
    // index-based guard resets across that boundary and fires twice.
    install();
    const onCommand = vi.fn();
    const voice = new VoiceCommands(onCommand);
    voice.start();

    FakeRecognition.last!.say(['next']);        // interim, session A
    FakeRecognition.last!.onend?.();            // session A ends, restarts
    FakeRecognition.last!.say(['next']);        // final for the same word

    expect(onCommand).toHaveBeenCalledTimes(1);
  });

  it('still allows a deliberate second "next" a moment later', () => {
    install();
    const onCommand = vi.fn();
    const voice = new VoiceCommands(onCommand);
    voice.start();

    FakeRecognition.last!.say(['next']);
    vi.setSystemTime(Date.now() + 1500);
    FakeRecognition.last!.say(['next', 'next'], 1);

    expect(onCommand).toHaveBeenCalledTimes(2);
  });

  it('fires again at the same result index once the cooldown has passed', () => {
    install();
    const onCommand = vi.fn();
    const voice = new VoiceCommands(onCommand);
    voice.start();

    FakeRecognition.last!.say(['next']);
    vi.setSystemTime(Date.now() + 1500);
    FakeRecognition.last!.say(['next']);   // same index, new utterance

    expect(onCommand).toHaveBeenCalledTimes(2);
  });

  it('explains a blocked microphone and gives up', () => {
    install();
    const voice = new VoiceCommands(() => {});
    voice.start();

    FakeRecognition.last!.onerror?.({ error: 'not-allowed' });

    expect(voice.listening).toBe(false);
    expect(voice.error).toMatch(/Microphone blocked/);
  });

  it('treats silence as normal and keeps listening', () => {
    install();
    const voice = new VoiceCommands(() => {});
    voice.start();

    FakeRecognition.last!.onerror?.({ error: 'no-speech' });

    expect(voice.listening).toBe(true);
    expect(voice.error).toBe('');
  });
});
