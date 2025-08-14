import {
  ServiceStatus,
  SyncRequest,
  LogsResponse,
  AddNoteRequest,
} from "./types";

export class ApiClient {
  constructor(private baseUrl: string = "http://localhost:3000") {}

  async getStatus(): Promise<ServiceStatus> {
    console.log("Getting Status....");
    const response = await fetch(`${this.baseUrl}/status`);
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }
    return response.json();
  }

  async addNote(request: AddNoteRequest): Promise<void> {
    console.log("Adding Note....");
    const response = await fetch(`${this.baseUrl}/add-note`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Failed to add note: ${response.statusText}`);
    }
    return response.json();
  }

  async sync(request?: SyncRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request || {}),
    });
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  async getLogs(): Promise<LogsResponse> {
    const response = await fetch(`${this.baseUrl}/logs`);
    if (!response.ok) {
      throw new Error(`Failed to get logs: ${response.statusText}`);
    }
    return response.json();
  }

  async shutdown(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/shutdown`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(`Shutdown failed: ${response.statusText}`);
    }
  }
}
