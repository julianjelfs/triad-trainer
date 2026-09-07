import { afterEach, describe, expect, it, vi } from 'vitest';
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

afterEach(() => {
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
