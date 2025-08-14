import { getDailyTemplate } from "./config/daily-template.config";
import path from "path";
import fs from "fs";
import { Logger } from "./logger";

export class NoteInteractor {
  constructor(
    private notesDir: string,
    private noteFile: string,
  ) {}

  writeNewDay() {
    try {
      const template = getDailyTemplate(
        new Date().toLocaleDateString(),
        "And I will be with you until the end",
        "The Christ",
      );

      this.append("\n\n" + template);

      Logger.log(
        `Daily section created for ${new Date().toLocaleDateString()}`,
      );
    } catch (error) {
      Logger.error(
        `Failed to write daily section: ${(error as Error).message}`,
      );
    }
  }

  append(text: string) {
    fs.writeFileSync(path.join(this.notesDir, this.noteFile), text, {
      flag: "a",
    });
  }
}
