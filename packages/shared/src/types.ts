// Shared types for API communication
export interface ServiceStatus {
  running: boolean;
  watching: string;
  lastSync: string;
  uptime: number;
}

export interface AddNoteRequest {
  text: string;
}

export interface SyncRequest {
  force?: boolean;
}

export interface LogsResponse {
  logs: string[];
  total: number;
}

export interface Config {
  notesDir: string;
  debounceMs: number;
  glob: string;
  ignore: string[];
  server: {
    port: number;
    host: string;
  };
}

// New types for enhanced note functionality
export interface AddTodoRequest {
  text: string;
}

export interface MarkTodoCompleteRequest {
  todoText: string;
}

export interface MarkTodoCompleteResponse {
  success: boolean;
}

export interface DeleteTodoRequest {
  todoText: string;
}

export interface DeleteTodoResponse {
  success: boolean;
  message: string;
}

export interface AIQueryRequest {
  query: string;
  timeRange: {
    days?: number;
    type?: "today" | "week" | "month" | "custom";
  };
  analysisType?: "focus" | "review" | "next" | "general";
}

export interface AIQueryResponse {
  response: string;
  contextUsed: {
    daysCovered: number;
    charactersUsed: number;
    truncated: boolean;
  };
  suggestions?: string[];
}

export interface SearchNotesRequest {
  query: string;
  daysBack?: number;
}

export interface SearchNotesResponse {
  results: Array<{
    date: string;
    context: string;
  }>;
}

export interface GetIncompleteTodosRequest {
  daysBack?: number;
}

export interface GetIncompleteTodosResponse {
  todos: Array<{
    date: string;
    todo: string;
  }>;
}

export interface ArchiveCompletedTodosResponse {
  archivedCount: number;
}

export interface FormatDocumentResponse {
  formatted: boolean;
  changesMade: string[];
}

export interface FormatSectionRequest {
  sectionName: string;
}

export interface FormatSectionResponse {
  success: boolean;
}

export interface ValidateFormattingResponse {
  isValid: boolean;
  issues: string[];
}

// Daily section management types
export interface DailyStatusResponse {
  hasToday: boolean;
  missingDays: string[];
  timeSinceLastEntry: number;
}

export interface CreateDailyRequest {
  force?: boolean;
}

export interface CreateDailyResponse {
  created: boolean;
  reason: string;
}

export interface ViewNotesRequest {
  type: "today" | "recent" | "all";
  days?: number; // for recent
}

export interface ViewNotesResponse {
  content: string;
  metadata: {
    type: "today" | "recent" | "all";
    daysCovered?: number;
    totalLines: number;
    dateRange?: {
      start: string;
      end: string;
    };
  };
}
