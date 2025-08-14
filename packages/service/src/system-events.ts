import { EventEmitter } from "node:events";

export class SystemEvents {
  private static emitter = new EventEmitter();

  static onAddNote(callback: (text: string) => void) {
    this.emitter.on("add-note", callback);
  }

  static emitAddNote(text: string) {
    this.emitter.emit("add-note", text);
  }
}
