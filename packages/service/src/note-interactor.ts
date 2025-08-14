import { getDailyTemplate } from "./config/daily-template.config";
import path from "path";
import fs from "fs";
import { Logger } from "./logger";

// Section constants for parsing
const TODAY_SECTION = `**Today's Focus**`;
const NOTE_SECTION = `**Notes**`;
const DONE_SECTION = `**Done**`;
const TOMORROW_SECTION = `**Tomorrow**`;

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

  // Helper method to read the full notes file
  private readNotesFile(): string {
    const filePath = path.join(this.notesDir, this.noteFile);
    if (!fs.existsSync(filePath)) {
      return "";
    }
    return fs.readFileSync(filePath, "utf8");
  }

  // Helper method to parse days from the notes file
  private parseDays(content: string): Map<string, string> {
    const days = new Map<string, string>();

    // Split by headers that start with #
    const dayBlocks = content.split(/^# /m).filter((block) => block.trim());

    for (const block of dayBlocks) {
      const lines = block.split("\n");
      const dateMatch = lines[0].match(/^(.+?)$/);

      if (dateMatch) {
        const dateStr = dateMatch[1].trim();
        const dayContent = "# " + block;
        days.set(dateStr, dayContent);
      }
    }

    return days;
  }

  // Helper method to extract section content
  private extractSection(
    text: string,
    sectionHeader: string,
    nextSectionHeader?: string,
  ): string {
    const sectionIndex = text.indexOf(sectionHeader);
    if (sectionIndex === -1) return "";

    const startIndex = sectionIndex + sectionHeader.length;
    let endIndex = text.length;

    if (nextSectionHeader) {
      const nextIndex = text.indexOf(nextSectionHeader, startIndex);
      if (nextIndex !== -1) {
        endIndex = nextIndex;
      }
    }

    return text.substring(startIndex, endIndex).trim();
  }

  // Helper method to find today's date section in the file
  private getTodaySection(): {
    content: string;
    startPos: number;
    endPos: number;
  } | null {
    const content = this.readNotesFile();
    const todayDate = new Date().toLocaleDateString();

    const todayHeaderRegex = new RegExp(
      `^# ${todayDate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "m",
    );
    const todayMatch = content.match(todayHeaderRegex);

    if (!todayMatch) return null;

    const startPos = todayMatch.index!;

    // Find the next day section or end of file
    const nextDayRegex = /^# \d+\/\d+\/\d+/m;
    const remainingContent = content.substring(startPos + todayMatch[0].length);
    const nextDayMatch = remainingContent.match(nextDayRegex);

    const endPos = nextDayMatch
      ? startPos + todayMatch[0].length + nextDayMatch.index!
      : content.length;

    const dayContent = content.substring(startPos, endPos);

    return { content: dayContent, startPos, endPos };
  }

  getPreviousDays(days: number): string[] {
    try {
      const content = this.readNotesFile();
      const dayMap = this.parseDays(content);

      // Get dates and sort them in descending order (most recent first)
      const sortedDates = Array.from(dayMap.keys()).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB.getTime() - dateA.getTime();
      });

      // Take the requested number of days (excluding today)
      const today = new Date().toLocaleDateString();
      const previousDates = sortedDates
        .filter((date) => date !== today)
        .slice(0, days);

      return previousDates.map((date) => dayMap.get(date) || "");
    } catch (error) {
      Logger.error(`Failed to get previous days: ${(error as Error).message}`);
      return [];
    }
  }

  getDate(date: Date): string {
    try {
      const content = this.readNotesFile();
      const dayMap = this.parseDays(content);
      const dateStr = date.toLocaleDateString();

      return dayMap.get(dateStr) || "";
    } catch (error) {
      Logger.error(
        `Failed to get date ${date.toLocaleDateString()}: ${(error as Error).message}`,
      );
      return "";
    }
  }

  getTodos(dayText: string): string[] {
    try {
      const todosSection = this.extractSection(
        dayText,
        TODAY_SECTION,
        NOTE_SECTION,
      );

      // Extract checkbox items (- [ ] or - [x])
      const todoRegex = /^- \[[ x]\] (.+)$/gm;
      const todos: string[] = [];
      let match;

      while ((match = todoRegex.exec(todosSection)) !== null) {
        todos.push(match[1].trim());
      }

      return todos;
    } catch (error) {
      Logger.error(`Failed to extract todos: ${(error as Error).message}`);
      return [];
    }
  }

  getNotes(dayText: string): string {
    try {
      return this.extractSection(dayText, NOTE_SECTION, DONE_SECTION);
    } catch (error) {
      Logger.error(`Failed to extract notes: ${(error as Error).message}`);
      return "";
    }
  }

  addTodo(text: string): void {
    try {
      const todaySection = this.getTodaySection();
      if (!todaySection) {
        Logger.error("Today's section not found. Creating new day first.");
        this.writeNewDay();
        return this.addTodo(text);
      }

      const content = this.readNotesFile();
      const todayFocusStart = todaySection.content.indexOf(TODAY_SECTION);
      if (todayFocusStart === -1) {
        Logger.error("Today's Focus section not found");
        return;
      }

      // Find the end of the Today's Focus section
      const notesSectionStart = todaySection.content.indexOf(
        NOTE_SECTION,
        todayFocusStart,
      );
      if (notesSectionStart === -1) {
        Logger.error("Notes section not found");
        return;
      }

      // Find the last todo item in the Today's Focus section
      const focusSection = todaySection.content.substring(
        todayFocusStart,
        notesSectionStart,
      );
      const todoRegex = /^- \[[ x]\] .+$/gm;
      let lastTodoEnd = todayFocusStart + TODAY_SECTION.length;
      let match;

      while ((match = todoRegex.exec(focusSection)) !== null) {
        lastTodoEnd = todayFocusStart + match.index! + match[0].length;
      }

      // Insert the new todo
      const newTodo = `\n- [ ] ${text}`;
      const insertPosition = todaySection.startPos + lastTodoEnd;

      const newContent =
        content.substring(0, insertPosition) +
        newTodo +
        content.substring(insertPosition);

      fs.writeFileSync(path.join(this.notesDir, this.noteFile), newContent);
      Logger.log(`Added todo: ${text}`);
    } catch (error) {
      Logger.error(`Failed to add todo: ${(error as Error).message}`);
    }
  }

  addNote(text: string): void {
    try {
      const todaySection = this.getTodaySection();
      if (!todaySection) {
        Logger.error("Today's section not found. Creating new day first.");
        this.writeNewDay();
        return this.addNote(text);
      }

      const content = this.readNotesFile();
      const notesSectionStart = todaySection.content.indexOf(NOTE_SECTION);
      if (notesSectionStart === -1) {
        Logger.error("Notes section not found");
        return;
      }

      // Find the end of the Notes section (before Done section)
      const doneSectionStart = todaySection.content.indexOf(
        DONE_SECTION,
        notesSectionStart,
      );
      if (doneSectionStart === -1) {
        Logger.error("Done section not found");
        return;
      }

      // Find where to insert the note (at the end of the Notes section)
      const notesSection = todaySection.content.substring(
        notesSectionStart + NOTE_SECTION.length,
        doneSectionStart,
      );

      // Find the last non-empty line in the notes section
      const noteLines = notesSection.split('\n');
      let lastContentIndex = -1;
      
      for (let i = noteLines.length - 1; i >= 0; i--) {
        if (noteLines[i].trim()) {
          lastContentIndex = i;
          break;
        }
      }

      // Calculate insertion position
      const basePosition = todaySection.startPos + notesSectionStart + NOTE_SECTION.length;
      let insertPosition;
      let newNoteText;
      
      if (lastContentIndex === -1) {
        // No existing notes, insert right after the header
        insertPosition = basePosition;
        newNoteText = `\n\n${text}`;
      } else {
        // Insert after existing notes
        const contentUpToLastLine = noteLines.slice(0, lastContentIndex + 1).join('\n');
        insertPosition = basePosition + contentUpToLastLine.length;
        newNoteText = `\n\n${text}`;
      }

      const newContent =
        content.substring(0, insertPosition) +
        newNoteText +
        content.substring(insertPosition);

      fs.writeFileSync(path.join(this.notesDir, this.noteFile), newContent);
      Logger.log(`Added note: ${text.substring(0, 50)}...`);
    } catch (error) {
      Logger.error(`Failed to add note: ${(error as Error).message}`);
    }
  }

  markTodoComplete(todoText: string): boolean {
    try {
      const content = this.readNotesFile();
      const todoPattern = new RegExp(
        `^(- \\[ \\] )(${todoText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})$`,
        "gm",
      );

      if (!todoPattern.test(content)) {
        Logger.error(`Todo not found: ${todoText}`);
        return false;
      }

      const updatedContent = content.replace(todoPattern, "- [x] $2");
      fs.writeFileSync(path.join(this.notesDir, this.noteFile), updatedContent);

      Logger.log(`Marked todo complete: ${todoText}`);
      return true;
    } catch (error) {
      Logger.error(`Failed to mark todo complete: ${(error as Error).message}`);
      return false;
    }
  }

  deleteTodo(todoText: string): boolean {
    try {
      const content = this.readNotesFile();
      // Match both incomplete and complete todos
      const todoPattern = new RegExp(
        `^- \\[[x ]\\] ${todoText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
        "gm",
      );

      if (!todoPattern.test(content)) {
        Logger.error(`Todo not found: ${todoText}`);
        return false;
      }

      // Remove the entire line including newlines
      const updatedContent = content.replace(todoPattern, "");
      // Clean up any double newlines that might result
      const cleanedContent = updatedContent.replace(/\n\n\n+/g, "\n\n");
      
      fs.writeFileSync(path.join(this.notesDir, this.noteFile), cleanedContent);

      Logger.log(`Deleted todo: ${todoText}`);
      return true;
    } catch (error) {
      Logger.error(`Failed to delete todo: ${(error as Error).message}`);
      return false;
    }
  }

  searchNotes(
    query: string,
    daysBack: number = 30,
  ): Array<{ date: string; context: string }> {
    try {
      const content = this.readNotesFile();
      const dayMap = this.parseDays(content);
      const results: Array<{ date: string; context: string }> = [];

      // Get dates and sort them in descending order
      const sortedDates = Array.from(dayMap.keys()).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB.getTime() - dateA.getTime();
      });

      // Search through the specified number of days
      const searchDates = sortedDates.slice(0, daysBack);
      const searchRegex = new RegExp(
        query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi",
      );

      for (const date of searchDates) {
        const dayContent = dayMap.get(date) || "";
        const lines = dayContent.split("\n");

        for (let i = 0; i < lines.length; i++) {
          if (searchRegex.test(lines[i])) {
            // Get context: 1 line before and after the match
            const contextStart = Math.max(0, i - 1);
            const contextEnd = Math.min(lines.length, i + 2);
            const context = lines.slice(contextStart, contextEnd).join("\n");

            results.push({
              date,
              context: context.trim(),
            });
          }
        }
      }

      Logger.log(`Search for "${query}" found ${results.length} results`);
      return results;
    } catch (error) {
      Logger.error(`Failed to search notes: ${(error as Error).message}`);
      return [];
    }
  }

  getIncompleteTodos(
    daysBack: number = 7,
  ): Array<{ date: string; todo: string }> {
    try {
      const content = this.readNotesFile();
      const dayMap = this.parseDays(content);
      const incompleteTodos: Array<{ date: string; todo: string }> = [];

      // Get dates and sort them in descending order
      const sortedDates = Array.from(dayMap.keys()).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB.getTime() - dateA.getTime();
      });

      // Check the specified number of days
      const checkDates = sortedDates.slice(0, daysBack);

      for (const date of checkDates) {
        const dayContent = dayMap.get(date) || "";
        const todos = this.getTodos(dayContent);

        // Get incomplete todos (those that start with [ ])
        const incompleteRegex = /^- \[ \] (.+)$/gm;
        const todayFocusSection = this.extractSection(
          dayContent,
          TODAY_SECTION,
          NOTE_SECTION,
        );

        let match;
        while ((match = incompleteRegex.exec(todayFocusSection)) !== null) {
          incompleteTodos.push({
            date,
            todo: match[1].trim(),
          });
        }
      }

      Logger.log(
        `Found ${incompleteTodos.length} incomplete todos from last ${daysBack} days`,
      );
      return incompleteTodos;
    } catch (error) {
      Logger.error(
        `Failed to get incomplete todos: ${(error as Error).message}`,
      );
      return [];
    }
  }

  archiveCompletedTodos(): number {
    try {
      const todaySection = this.getTodaySection();
      if (!todaySection) {
        Logger.error("Today's section not found");
        return 0;
      }

      const content = this.readNotesFile();
      const todayFocusSection = this.extractSection(
        todaySection.content,
        TODAY_SECTION,
        NOTE_SECTION,
      );
      const doneSection = this.extractSection(
        todaySection.content,
        DONE_SECTION,
        TOMORROW_SECTION,
      );

      // Find completed todos in Today's Focus
      const completedTodoRegex = /^- \[x\] (.+)$/gm;
      const completedTodos: string[] = [];
      let match;

      while ((match = completedTodoRegex.exec(todayFocusSection)) !== null) {
        completedTodos.push(match[1].trim());
      }

      if (completedTodos.length === 0) {
        Logger.log("No completed todos to archive");
        return 0;
      }

      // Remove completed todos from Today's Focus section
      let updatedTodayFocus = todayFocusSection;
      for (const todo of completedTodos) {
        const todoPattern = new RegExp(
          `^- \\[x\\] ${todo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "gm",
        );
        updatedTodayFocus = updatedTodayFocus.replace(todoPattern, "");
      }

      // Clean up extra newlines
      updatedTodayFocus = updatedTodayFocus.replace(/\n\n+/g, "\n\n").trim();

      // Add completed todos to Done section
      const archivedTodos = completedTodos
        .map((todo) => `- ${todo}`)
        .join("\n");
      const updatedDoneSection = doneSection
        ? `${doneSection}\n${archivedTodos}`
        : archivedTodos;

      // Rebuild the day's content
      const todayFocusStart = todaySection.content.indexOf(TODAY_SECTION);
      const notesSectionStart = todaySection.content.indexOf(NOTE_SECTION);
      const doneSectionStart = todaySection.content.indexOf(DONE_SECTION);
      const tomorrowSectionStart =
        todaySection.content.indexOf(TOMORROW_SECTION);

      let newDayContent = todaySection.content.substring(
        0,
        todayFocusStart + TODAY_SECTION.length,
      );
      newDayContent += `\n\n${updatedTodayFocus}\n\n`;
      newDayContent += todaySection.content.substring(
        notesSectionStart,
        doneSectionStart + DONE_SECTION.length,
      );
      newDayContent += `\n\n${updatedDoneSection}\n\n`;
      newDayContent += todaySection.content.substring(tomorrowSectionStart);

      // Replace the day's content in the full file
      const newContent =
        content.substring(0, todaySection.startPos) +
        newDayContent +
        content.substring(todaySection.endPos);

      fs.writeFileSync(path.join(this.notesDir, this.noteFile), newContent);

      Logger.log(`Archived ${completedTodos.length} completed todos`);
      return completedTodos.length;
    } catch (error) {
      Logger.error(
        `Failed to archive completed todos: ${(error as Error).message}`,
      );
      return 0;
    }
  }

  formatDocument(): { formatted: boolean; changesMade: string[] } {
    try {
      const content = this.readNotesFile();
      if (!content.trim()) {
        Logger.log("No content to format");
        return { formatted: false, changesMade: [] };
      }

      const changes: string[] = [];
      let formattedContent = content;

      // 1. Remove trailing whitespace from all lines
      const beforeTrailing = formattedContent;
      formattedContent = formattedContent.replace(/[ \t]+$/gm, '');
      if (beforeTrailing !== formattedContent) {
        changes.push("Removed trailing whitespace");
      }

      // 2. Normalize multiple consecutive blank lines (max 2 blank lines) but preserve content integrity
      const beforeBlankLines = formattedContent;
      formattedContent = formattedContent.replace(/\n{4,}/g, '\n\n\n');
      if (beforeBlankLines !== formattedContent) {
        changes.push("Normalized excessive blank lines");
      }

      // 2.5. Fix any accidentally broken quotes and dates
      const beforeFixes = formattedContent;
      // Fix broken quotes (rejoin lines that should be together without adding extra spaces)
      formattedContent = formattedContent.replace(/(_[^_\n]*)\n([^_\n]*_)/g, '$1$2');
      // Fix broken dates (rejoin date parts)
      formattedContent = formattedContent.replace(/(# \d{1,2}\/\d{1,2}\/\d{2,3})\n(\d)/gm, '$1$2');
      if (beforeFixes !== formattedContent) {
        changes.push("Fixed broken content lines");
      }

      // 3. Ensure consistent spacing around headers (but don't break dates)
      const beforeHeaders = formattedContent;
      // Add blank line before headers (except at start of file) - but only for complete date lines
      formattedContent = formattedContent.replace(/(?<!^)(?<!\n\n)(\n)(# \d{1,2}\/\d{1,2}\/\d{4})/gm, '\n\n$2');
      // Ensure blank line after complete date headers
      formattedContent = formattedContent.replace(/(^# \d{1,2}\/\d{1,2}\/\d{4})(?!\n\n)/gm, '$1\n');
      if (beforeHeaders !== formattedContent) {
        changes.push("Standardized header spacing");
      }

      // 4. Standardize todo formatting (ensure space after checkbox)
      const beforeTodos = formattedContent;
      formattedContent = formattedContent.replace(/^-\s*\[([x ])\]([^ ])/gm, '- [$1] $2');
      formattedContent = formattedContent.replace(/^-\s*\[([x ])\]\s+/gm, '- [$1] ');
      if (beforeTodos !== formattedContent) {
        changes.push("Standardized todo formatting");
      }

      // 5. Ensure consistent bullet point formatting
      const beforeBullets = formattedContent;
      formattedContent = formattedContent.replace(/^-([^ ])/gm, '- $1');
      formattedContent = formattedContent.replace(/^-\s{2,}/gm, '- ');
      if (beforeBullets !== formattedContent) {
        changes.push("Standardized bullet points");
      }

      // 6. Standardize section spacing (ensure double line break after section headers)
      const beforeSections = formattedContent;
      const sectionHeaders = [TODAY_SECTION, NOTE_SECTION, DONE_SECTION, TOMORROW_SECTION];
      for (const section of sectionHeaders) {
        const sectionRegex = new RegExp(`(\\*\\*${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*)(?!\\n\\n)`, 'g');
        formattedContent = formattedContent.replace(sectionRegex, '$1\n');
      }
      if (beforeSections !== formattedContent) {
        changes.push("Standardized section spacing");
      }

      // 7. Clean up quote formatting (ensure proper spacing around quotes, but don't break quote content)
      const beforeQuotes = formattedContent;
      // Fix malformed quotes (remove space after opening underscore)
      formattedContent = formattedContent.replace(/(_ )([^_]*_)/g, '_$2');
      // Only add spacing after quotes that are followed by section headers or other content, but preserve quote integrity
      formattedContent = formattedContent.replace(/(_[^_\n]+_)(\s*)(\*\*)/gm, '$1\n\n$3');
      if (beforeQuotes !== formattedContent) {
        changes.push("Cleaned quote formatting");
      }

      // 8. Ensure file ends with single newline
      const beforeEnding = formattedContent;
      formattedContent = formattedContent.replace(/\n*$/, '\n');
      if (beforeEnding !== formattedContent) {
        changes.push("Normalized file ending");
      }

      // 9. Remove empty todo items and clean up orphaned formatting
      const beforeEmpty = formattedContent;
      formattedContent = formattedContent.replace(/^- \[ \]\s*$/gm, '');
      formattedContent = formattedContent.replace(/^- \[x\]\s*$/gm, '');
      if (beforeEmpty !== formattedContent) {
        changes.push("Removed empty todo items");
      }

      // 10. Final cleanup - remove any triple+ newlines and fix any remaining broken content
      formattedContent = formattedContent.replace(/\n{4,}/g, '\n\n\n');
      
      // Final pass: ensure quotes and dates weren't accidentally broken by any of the above rules
      formattedContent = formattedContent.replace(/(_[^_\n]*)\n([^_\n]*_)/g, '$1$2');
      formattedContent = formattedContent.replace(/(# \d{1,2}\/\d{1,2}\/\d{2,3})\n(\d)/gm, '$1$2');

      if (changes.length > 0) {
        fs.writeFileSync(path.join(this.notesDir, this.noteFile), formattedContent);
        Logger.log(`Document formatted with ${changes.length} changes: ${changes.join(', ')}`);
        return { formatted: true, changesMade: changes };
      } else {
        Logger.log("Document already properly formatted");
        return { formatted: false, changesMade: [] };
      }

    } catch (error) {
      Logger.error(`Failed to format document: ${(error as Error).message}`);
      return { formatted: false, changesMade: [] };
    }
  }

  // Advanced formatter for specific cleanup scenarios
  formatSection(sectionName: string): boolean {
    try {
      const todaySection = this.getTodaySection();
      if (!todaySection) {
        Logger.error("Today's section not found");
        return false;
      }

      const content = this.readNotesFile();
      let updatedSection = todaySection.content;

      // Format specific section based on name
      switch (sectionName) {
        case 'todos':
          // Clean up Today's Focus section
          const focusSection = this.extractSection(updatedSection, TODAY_SECTION, NOTE_SECTION);
          let cleanFocus = focusSection
            .replace(/^- \[ \]\s*$/gm, '') // Remove empty todos
            .replace(/^-\s*\[([x ])\]\s+/gm, '- [$1] ') // Standardize formatting
            .replace(/\n{3,}/g, '\n\n'); // Remove excessive blank lines
          
          // Replace the section
          updatedSection = updatedSection.replace(
            new RegExp(`(${TODAY_SECTION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})([\\s\\S]*?)(?=${NOTE_SECTION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`),
            `$1\n\n${cleanFocus.trim()}\n\n`
          );
          break;

        case 'notes':
          // Clean up Notes section
          const notesSection = this.extractSection(updatedSection, NOTE_SECTION, DONE_SECTION);
          let cleanNotes = notesSection
            .replace(/[ \t]+$/gm, '') // Remove trailing whitespace
            .replace(/\n{4,}/g, '\n\n\n') // Limit consecutive blank lines
            .trim();
          
          // Replace the section
          updatedSection = updatedSection.replace(
            new RegExp(`(${NOTE_SECTION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})([\\s\\S]*?)(?=${DONE_SECTION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`),
            `$1\n\n${cleanNotes}\n\n`
          );
          break;

        default:
          Logger.error(`Unknown section: ${sectionName}`);
          return false;
      }

      // Replace the day's content in the full file
      const newContent = content.substring(0, todaySection.startPos) +
                        updatedSection +
                        content.substring(todaySection.endPos);

      fs.writeFileSync(path.join(this.notesDir, this.noteFile), newContent);
      Logger.log(`Formatted ${sectionName} section`);
      return true;

    } catch (error) {
      Logger.error(`Failed to format section ${sectionName}: ${(error as Error).message}`);
      return false;
    }
  }

  // Validation helper to check common formatting issues
  validateFormatting(): { isValid: boolean; issues: string[] } {
    try {
      const content = this.readNotesFile();
      const issues: string[] = [];

      // Check for broken dates
      const brokenDatePattern = /(# \d{1,2}\/\d{1,2}\/\d{2,3})\n(\d)/gm;
      if (brokenDatePattern.test(content)) {
        issues.push("Found broken date headers");
      }

      // Check for broken quotes
      const brokenQuotePattern = /(_[^_\n]*)\n([^_\n]*_)/g;
      if (brokenQuotePattern.test(content)) {
        issues.push("Found broken quote formatting");
      }

      // Check for malformed quotes (space after opening underscore)
      const malformedQuotePattern = /(_ [^_]*_)/g;
      if (malformedQuotePattern.test(content)) {
        issues.push("Found quotes with incorrect spacing");
      }

      // Check for excessive blank lines
      if (/\n{4,}/.test(content)) {
        issues.push("Found excessive blank lines (4+)");
      }

      // Check for trailing whitespace
      if (/[ \t]+$/m.test(content)) {
        issues.push("Found trailing whitespace");
      }

      // Check for inconsistent todo formatting
      if (/^-\s*\[([x ])\]([^ ])/m.test(content)) {
        issues.push("Found inconsistent todo formatting");
      }

      Logger.log(`Formatting validation: ${issues.length} issues found`);
      return { isValid: issues.length === 0, issues };

    } catch (error) {
      Logger.error(`Failed to validate formatting: ${(error as Error).message}`);
      return { isValid: false, issues: ["Validation failed"] };
    }
  }

  // Check if today's section already exists
  hasTodaySection(): boolean {
    return this.getTodaySection() !== null;
  }

  // Check if today's section is missing (only creates today, never backfills gaps)
  checkForMissingDays(): string[] {
    try {
      const content = this.readNotesFile();
      const dayMap = this.parseDays(content);
      
      if (dayMap.size === 0) {
        // No days exist, we definitely need today
        return [new Date().toLocaleDateString()];
      }

      const missingDays: string[] = [];
      
      // Only check if today is missing - we don't backfill gaps between days
      if (!this.hasTodaySection()) {
        missingDays.push(new Date().toLocaleDateString());
      }

      return missingDays;
    } catch (error) {
      Logger.error(`Failed to check for missing days: ${(error as Error).message}`);
      return [];
    }
  }

  // Auto-create daily section if needed (enhanced version)
  autoCreateDailySection(force: boolean = false): { created: boolean; reason: string } {
    try {
      // Check if today already exists (unless forced)
      if (!force && this.hasTodaySection()) {
        return { created: false, reason: "Today's section already exists" };
      }

      // Check for missing days
      const missingDays = this.checkForMissingDays();
      
      if (missingDays.length === 0 && !force) {
        return { created: false, reason: "No missing days detected" };
      }

      // Create today's section (or force create)
      const today = new Date().toLocaleDateString();
      if (missingDays.includes(today) || force) {
        this.writeNewDay();
        Logger.log(`Auto-created daily section for ${today}`);
        return { created: true, reason: `Created section for ${today}` };
      }

      return { created: false, reason: "Today's section not needed" };
    } catch (error) {
      Logger.error(`Failed to auto-create daily section: ${(error as Error).message}`);
      return { created: false, reason: `Error: ${(error as Error).message}` };
    }
  }

  // Get time since last entry (useful for wake detection logic)
  getTimeSinceLastEntry(): number {
    try {
      const content = this.readNotesFile();
      const dayMap = this.parseDays(content);
      
      if (dayMap.size === 0) {
        return Infinity; // No entries, very long time
      }

      const sortedDates = Array.from(dayMap.keys()).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB.getTime() - dateA.getTime();
      });

      const lastDate = new Date(sortedDates[0]);
      const now = new Date();
      
      return now.getTime() - lastDate.getTime();
    } catch (error) {
      Logger.error(`Failed to get time since last entry: ${(error as Error).message}`);
      return 0;
    }
  }
}
