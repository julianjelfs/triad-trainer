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

export class VoiceCommands {
  readonly supported = recognitionConstructor() !== null;

  listening = $state(false);
  /** Set when the mic is refused or unavailable; cleared on the next start. */
  error = $state('');

  #recognition: SpeechRecognition | null = null;
  /** True between start() and stop(), so an auto-ended session can be resumed. */
  #wanted = false;
  /** Highest result index already acted on, so one utterance fires once. */
  #firedFor = -1;

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
        if (i <= this.#firedFor) continue;
        if (!COMMAND.test(event.results[i][0].transcript.toLowerCase())) continue;
        this.#firedFor = i;
        this.onCommand();
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
      this.#firedFor = -1;
      try {
        recognition.start();
      } catch {
        this.stop();
      }
    };

    this.#recognition = recognition;
    this.#wanted = true;
    this.#firedFor = -1;
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
