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
