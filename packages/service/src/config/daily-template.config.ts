const TODO_SECTION = `**Today's Focus**`;
const NOTE_SECTION = `**Notes**`;
const DONE_SECTION = `**Done**`;
const TOMORROW_SECTION = `**Tomorrow**`;

export const DAILY_TEMPLATE = `# {date}

_{quote} - {name}_


${TODO_SECTION}

- [ ] Task 1

${NOTE_SECTION}



${DONE_SECTION}



${TOMORROW_SECTION}



`;

export function getDailyTemplate(
  todayDate: string,
  quote: string,
  quoteAuthor: string = "Unknown",
) {
  return DAILY_TEMPLATE.replace("{date}", todayDate)
    .replace("{quote}", quote)
    .replace("{name}", quoteAuthor);
}
