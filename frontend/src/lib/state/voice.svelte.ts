/**
 * Hands-free position stepping. Listens for a single spoken word and calls back.
 *
 * This is the browser's SpeechRecognition, which in Chrome is not on-device:
 * audio goes to Google's servers while listening. It is off by default and only
 * runs while the toggle is on, but that is worth knowing before switching it on.
 * Chrome and Edge only; Firefox has no implementation.
 */

interface RecognitionAlternative {
  transcript: string;
}

interface RecognitionResult {
  readonly length: number;
  isFinal: boolean;
  [index: number]: RecognitionAlternative;
}

interface RecognitionEvent {
  resultIndex: number;
  results: { readonly length: number; [index: number]: RecognitionResult };
}

interface RecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type RecognitionConstructor = new () => SpeechRecognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** The word that advances a position. Add to the pattern to add vocabulary. */
const COMMAND = /\bnext\b/;

/**
 * How long to ignore a repeat of the same word.
 *
 * One spoken "next" arrives several times: as interim results firming up, and
 * again as the final result. Android Chrome also ignores `continuous` and ends
 * the session after every utterance, so those repeats can straddle a restart
 * and arrive with the same result index twice over. Indices reset across that
 * boundary and cannot be used to tell a repeat from a new word; elapsed time
 * can. Comfortably shorter than any deliberate repeat while playing.
 */
const REPEAT_COOLDOWN_MS = 1000;

export class VoiceCommands {
  readonly supported = recognitionConstructor() !== null;

  listening = $state(false);
  /** Set when the mic is refused or unavailable; cleared on the next start. */
  error = $state('');

  #recognition: SpeechRecognition | null = null;
  /** True between start() and stop(), so an auto-ended session can be resumed. */
  #wanted = false;
  /** When the last command fired. One guard, so nothing can mask it. */
  #lastFiredAt = 0;

  constructor(private onCommand: () => void) {}

  toggle() {
    if (this.listening) this.stop();
    else this.start();
  }

  start() {
    const Recognition = recognitionConstructor();
    if (!Recognition || this.#wanted) return;

    const recognition = new Recognition();
    recognition.continuous = true;
    // Interim results fire as the word lands rather than a beat after it.
    recognition.interimResults = true;
    recognition.lang = 'en-GB';

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!COMMAND.test(event.results[i][0].transcript.toLowerCase())) continue;

        const now = Date.now();
        if (now - this.#lastFiredAt < REPEAT_COOLDOWN_MS) return;
        this.#lastFiredAt = now;
        this.onCommand();
        return;
      }
    };

    recognition.onerror = (event) => {
      // Silence is normal while you are working out a shape, so ignore it.
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      this.error =
        event.error === 'not-allowed'
          ? 'Microphone blocked. Allow it in the address bar to use Listen.'
          : `Voice input stopped (${event.error}).`;
      this.stop();
    };

    // Chrome ends a session on its own every so often; pick it straight back up.
    recognition.onend = () => {
      if (!this.#wanted) return;
      try {
        recognition.start();
      } catch {
        this.stop();
      }
    };

    this.#recognition = recognition;
    this.#wanted = true;
    this.#lastFiredAt = 0;
    this.error = '';

    try {
      recognition.start();
      this.listening = true;
    } catch {
      this.error = 'Could not start voice input.';
      this.stop();
    }
  }

  stop() {
    this.#wanted = false;
    this.listening = false;
    this.#recognition?.abort();
    this.#recognition = null;
  }
}
