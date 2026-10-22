export const PULSE_MS = 300;

export interface ChordCellState {
  isClicked: boolean;
  isPlaying: boolean;
  isGracePeriod: boolean;
  isInImmediateChordGracePeriod: boolean;
  wasPlayedLast: boolean;
  pulseStartedAt: number | undefined;
}

const idle: ChordCellState = {
  isClicked: false,
  isPlaying: false,
  isGracePeriod: false,
  isInImmediateChordGracePeriod: false,
  wasPlayedLast: false,
  pulseStartedAt: undefined,
};

/**
 * What each chord button shows and what a press on it does. The chord grid canvas draws from it.
 */
export class ChordGridStore {
  private states = new Map<string, ChordCellState>();
  private pressHandlers = new Map<string, () => Promise<void>>();
  private listener: (() => void) | undefined;

  get(chordName: string): ChordCellState {
    return this.states.get(chordName) ?? idle;
  }

  getPressHandler(chordName: string) {
    return this.pressHandlers.get(chordName);
  }

  onChange(listener: (() => void) | undefined) {
    this.listener = listener;
  }

  update(chordName: string, state: Partial<ChordCellState>) {
    this.states.set(chordName, { ...this.get(chordName), ...state });
    this.listener?.();
  }

  // the button shrinks and grows back when its chord plays
  pulse(chordName: string) {
    this.update(chordName, { pulseStartedAt: performance.now() });
  }

  isAnimating(now: number) {
    for (const { pulseStartedAt } of this.states.values()) {
      if (pulseStartedAt !== undefined && now - pulseStartedAt < PULSE_MS) {
        return true;
      }
    }
    return false;
  }

  registerPress(chordName: string, onPress: () => Promise<void>) {
    this.pressHandlers.set(chordName, onPress);
    return () => {
      this.pressHandlers.delete(chordName);
    };
  }
}
