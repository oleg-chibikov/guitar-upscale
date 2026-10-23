import { EventsByTick } from "@/app/engine/eventsByTick";
import { applyCommand, EditCommand } from "@/app/engine/pianoRoll/editCommand";
import { Subject } from "rxjs";

const MAX_HISTORY = 500;

// Tells which track changed after an edit, an undo or a redo
export const pianoRollEdits$ = new Subject<EventsByTick>();

/**
 * Undo and redo by replaying the stored changes of each command backward or forward
 */
export class EditHistory {
  private done: EditCommand[] = [];
  private undone: EditCommand[] = [];

  constructor(private data: EventsByTick) {}

  execute(command: EditCommand) {
    applyCommand(this.data, command, "forward");
    this.done.push(command);
    if (this.done.length > MAX_HISTORY) {
      this.done.shift();
    }
    this.undone = [];
    pianoRollEdits$.next(this.data);
  }

  undo(): EditCommand | undefined {
    const command = this.done.pop();
    if (command) {
      applyCommand(this.data, command, "backward");
      this.undone.push(command);
      pianoRollEdits$.next(this.data);
    }
    return command;
  }

  redo(): EditCommand | undefined {
    const command = this.undone.pop();
    if (command) {
      applyCommand(this.data, command, "forward");
      this.done.push(command);
      pianoRollEdits$.next(this.data);
    }
    return command;
  }

  get canUndo() {
    return this.done.length > 0;
  }

  get canRedo() {
    return this.undone.length > 0;
  }

  get undoLabel() {
    return this.done[this.done.length - 1]?.label;
  }

  get redoLabel() {
    return this.undone[this.undone.length - 1]?.label;
  }
}

const histories = new WeakMap<EventsByTick, EditHistory>();

// each melody or looper track keeps its own history for as long as it lives
export const getEditHistory = (data: EventsByTick) => {
  let history = histories.get(data);
  if (!history) {
    history = new EditHistory(data);
    histories.set(data, history);
  }
  return history;
};
