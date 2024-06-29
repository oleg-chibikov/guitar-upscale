import { TrackWithNumber } from "@/app/data/example";
import { NOTE_COUNT, Note, OctaveNote } from "@/app/data/notes";
import { parseStringToNotes, tunings } from "@/app/data/tunings";
import { TICKS_IN_HALF_BEAT } from "@/app/engine/clock/clockConstants";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { capoValue, neckValue, tuningValue } from "@/app/store/settingsSlice";
import { FRET_COUNT, Neck } from "../generateNeckRepresentation";

export class MelodyDecoder {
  private track: TrackWithNumber;
  private neck: Neck;
  private scriptTuning: OctaveNote[];
  private tuningShift = tunings[tuningValue].shift ?? 0;
  private currentTuning = parseStringToNotes(tuningValue);

  constructor(track: TrackWithNumber, scriptTuning: OctaveNote[]) {
    this.track = track;
    if (!neckValue) {
      throw new Error("Neck is not set up");
    }
    this.neck = neckValue;
    this.scriptTuning = scriptTuning;
  }

  decodeMelody(): EventsByTick {
    const result: EventsByTick = new EventsByTick();
    let index = 0;
    let stringNumber: number | undefined;
    let nextIsString = false;
    let fretNumberBuilder = "";
    let nextIsImmediateString = false;
    let nextIsImmediateChord = false;
    let immediateStringNumber: number | undefined;
    let immediateChord: string | undefined;
    let indexToRepeat: number | undefined;
    let repeatCount: number | undefined;
    const melody = this.track.melody;
    let tickIndex = 0;

    while (index < melody.length) {
      const char = melody[index];
      const nextChar =
        index !== melody.length - 1 ? melody[index + 1] : undefined;
      const nextSecondChar =
        index !== melody.length - 2 ? melody[index + 2] : undefined;
      const nextThirdChar =
        index !== melody.length - 3 ? melody[index + 3] : undefined;
      const number = parseFloat(char);
      const isNumeric = !isNaN(number);
      const recordChordAndReset = () => {
        if (immediateChord !== undefined) {
          nextIsImmediateChord = false;
          const newChord = this.convertChord(immediateChord, this.tuningShift);

          result.addOrUpdateEvent(tickIndex * TICKS_IN_HALF_BEAT, {
            chord: newChord,
            metadata: {
              trackNumber: this.track.trackNumber,
              trackInstrument: this.track.instrument,
              // TODO: We can set predefined values for delay and number of notes or leave them as in settings
            },
          });
          immediateChord = undefined;
        }
      };
      if (nextIsImmediateChord) {
        if (char === ">") {
          // end recording chord
          recordChordAndReset();
        } else {
          // keep recording chord
          if (immediateChord === undefined) {
            immediateChord = char;
          } else {
            immediateChord += char;
          }
        }
      } else if (isNumeric) {
        // note
        if (nextIsImmediateString) {
          // Remember the string number to play ONLY with the next note
          immediateStringNumber = number;
          nextIsImmediateString = false;
        } else if (nextIsString) {
          stringNumber = number;
          nextIsString = false;
        } else {
          fretNumberBuilder += char;
          if (nextChar === "-") {
            // The same note continues
          } else if (immediateStringNumber !== undefined) {
            if (fretNumberBuilder !== "") {
              // Note is fully read - we can play it without incrementing tick index (it's an immediate note)
              this.recordNote(
                result,
                tickIndex,
                fretNumberBuilder,
                immediateStringNumber
              );
              fretNumberBuilder = "";
              immediateStringNumber = undefined;
            }
          } else if (fretNumberBuilder !== "" && stringNumber !== undefined) {
            // Note is fully read - we can play it and increment the tick index
            this.recordNote(result, tickIndex, fretNumberBuilder, stringNumber);
            tickIndex++;
            fretNumberBuilder = "";
          }
        }
      } else if (char === "(") {
        // repeat section start
        indexToRepeat = index;
      } else if (char === ")") {
        // repeat section end
        if (indexToRepeat !== undefined) {
          if (repeatCount !== undefined) {
            if (repeatCount === 0) {
              // all repeats are played
              index += 2;
              repeatCount = undefined;
              indexToRepeat = undefined;
              continue; // skip the next char which is repeat count and continue with the further melody
            } else {
              repeatCount--;
              index = indexToRepeat; // returning to the beginning of the pattern
            }
          } else {
            if (nextChar === undefined) {
              repeatCount = 0;
            } else {
              repeatCount =
                nextSecondChar === "-" && nextThirdChar !== undefined //support repetition > 10 and < 100
                  ? parseInt(nextChar + nextThirdChar) - 1
                  : parseInt(nextChar) - 1;
            }

            repeatCount--;
            index = indexToRepeat; // returning to the beginning of the pattern
          }
        }
      } else if (char === "_") {
        // wait between notes
        tickIndex++;
      } else if (char === "*") {
        // set string marker for upcoming (not immediate) notes
        nextIsString = true;
      } else if (char === "^") {
        // start recording immediate string
        nextIsImmediateString = true;
      } else if (char === "<") {
        // start recording immediate string
        nextIsImmediateChord = true;
      }

      index++;
    }
    return result;
  }

  private convertChord(chord: string, tuningShift: number): string {
    const baseNote = capoValue;
    if (baseNote === 0 && !tuningShift) {
      return chord;
    }

    // Split the chord into note and alterations
    let chordNote = chord[0];
    let alterations = chord.substring(1);

    // If the second character is '#', include it in the chord note
    if (chord.length > 1 && chord[1] === "#") {
      chordNote += "#";
      alterations = chord.substring(2);
    }

    // Convert the chord note string to Note enum value
    const chordBaseNote = Note[chordNote as keyof typeof Note];

    // Calculate the difference between the provided note and the chord note
    const newBaseNote =
      (NOTE_COUNT + chordBaseNote + baseNote + tuningShift) % NOTE_COUNT;

    // Get the new chord note string
    const newChordNote = Object.keys(Note).find(
      (key) => Note[key as keyof typeof Note] === newBaseNote
    );

    // Reconstruct the chord string
    return newChordNote + alterations;
  }

  private recordNote(
    result: EventsByTick,
    tickIndex: number,
    fretNumberBuilder: string,
    stringNumber: number
  ) {
    const stringTuning = this.currentTuning[stringNumber]; // Get the custom tuning for the string
    const scriptStringTuning = this.scriptTuning[stringNumber]; // Get the original tuning for the string (melody is written using this tuning)
    const tuningDifference =
      (NOTE_COUNT + scriptStringTuning.note - stringTuning.note) % NOTE_COUNT;
    const shiftedBaseNote = capoValue + this.tuningShift;

    let fret = parseInt(fretNumberBuilder) + shiftedBaseNote + tuningDifference; // Adjust fret position based on tuning
    if (fret > FRET_COUNT) {
      fret = NOTE_COUNT + (fret % FRET_COUNT);
    }

    // TODO: go to the upper string (we already do that when playing scales)
    const string = this.neck[stringNumber];
    const stringOctaveNote = string[fret];

    if (stringOctaveNote) {
      result.addOrUpdateEvent(tickIndex * TICKS_IN_HALF_BEAT, {
        trackNumber: this.track.trackNumber,
        instrument: this.track.instrument,
        note: stringOctaveNote,
      });
      tickIndex++;
    }
  }
}
