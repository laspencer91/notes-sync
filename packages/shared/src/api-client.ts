import {
  ServiceStatus,
  SyncRequest,
  LogsResponse,
  AddNoteRequest,
  AddTodoRequest,
  MarkTodoCompleteRequest,
  MarkTodoCompleteResponse,
  DeleteTodoRequest,
  DeleteTodoResponse,
  SearchNotesRequest,
  SearchNotesResponse,
  GetIncompleteTodosResponse,
  ArchiveCompletedTodosResponse,
  FormatDocumentResponse,
  FormatSectionRequest,
  FormatSectionResponse,
  ValidateFormattingResponse,
  DailyStatusResponse,
  CreateDailyRequest,
  CreateDailyResponse,
  AIQueryRequest,
  AIQueryResponse,
  ViewNotesRequest,
  ViewNotesResponse,
} from "./types";

export class ApiClient {
  constructor(private baseUrl: string = "http://localhost:3127") {}

  async getStatus(): Promise<ServiceStatus> {
    console.log("Getting Status....");
    const response = await fetch(`${this.baseUrl}/status`);
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }
    return response.json();
  }

  async shutdown(): Promise<void> {
    console.log("Shutting down service...");
    const response = await fetch(`${this.baseUrl}/shutdown`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(`Failed to shutdown service: ${response.statusText}`);
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

  async addTodo(request: AddTodoRequest): Promise<void> {
    console.log("Adding Todo....");
    const response = await fetch(`${this.baseUrl}/add-todo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Failed to add todo: ${response.statusText}`);
    }
    return response.json();
  }

  async markTodoComplete(
    request: MarkTodoCompleteRequest,
  ): Promise<MarkTodoCompleteResponse> {
    console.log("Marking Todo Complete....");
    const response = await fetch(`${this.baseUrl}/mark-todo-complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Failed to mark todo complete: ${response.statusText}`);
    }
    return response.json();
  }

  async deleteTodo(request: DeleteTodoRequest): Promise<DeleteTodoResponse> {
    console.log("Deleting Todo....");
    const response = await fetch(`${this.baseUrl}/delete-todo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete todo: ${response.statusText}`);
    }
    return response.json();
  }

  async searchNotes(request: SearchNotesRequest): Promise<SearchNotesResponse> {
    console.log("Searching Notes....");
    const response = await fetch(`${this.baseUrl}/search-notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Failed to search notes: ${response.statusText}`);
    }
    return response.json();
  }

  async getIncompleteTodos(
    daysBack?: number,
  ): Promise<GetIncompleteTodosResponse> {
    console.log("Getting Incomplete Todos....");
    const queryParam = daysBack ? `?daysBack=${daysBack}` : "";
    const response = await fetch(
      `${this.baseUrl}/incomplete-todos${queryParam}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to get incomplete todos: ${response.statusText}`);
    }
    return response.json();
  }

  async archiveCompletedTodos(): Promise<ArchiveCompletedTodosResponse> {
    console.log("Archiving Completed Todos....");
    const response = await fetch(`${this.baseUrl}/archive-completed-todos`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(
        `Failed to archive completed todos: ${response.statusText}`,
      );
    }
    return response.json();
  }

  async formatDocument(): Promise<FormatDocumentResponse> {
    console.log("Formatting Document....");
    const response = await fetch(`${this.baseUrl}/format-document`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(`Failed to format document: ${response.statusText}`);
    }
    return response.json();
  }

  async formatSection(
    request: FormatSectionRequest,
  ): Promise<FormatSectionResponse> {
    console.log(`Formatting Section: ${request.sectionName}...`);
    const response = await fetch(`${this.baseUrl}/format-section`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Failed to format section: ${response.statusText}`);
    }
    return response.json();
  }

  async validateFormatting(): Promise<ValidateFormattingResponse> {
    console.log("Validating Formatting....");
    const response = await fetch(`${this.baseUrl}/validate-formatting`);
    if (!response.ok) {
      throw new Error(`Failed to validate formatting: ${response.statusText}`);
    }
    return response.json();
  }

  async getDailyStatus(): Promise<DailyStatusResponse> {
    console.log("Getting Daily Status....");
    const response = await fetch(`${this.baseUrl}/daily-status`);
    if (!response.ok) {
      throw new Error(`Failed to get daily status: ${response.statusText}`);
    }
    return response.json();
  }

  async createDaily(request: CreateDailyRequest): Promise<CreateDailyResponse> {
    console.log("Creating Daily Section....");
    const response = await fetch(`${this.baseUrl}/create-daily`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Failed to create daily section: ${response.statusText}`);
    }
    return response.json();
  }

  async aiQuery(request: AIQueryRequest): Promise<AIQueryResponse> {
    console.log("AI Query requested...");
    const response = await fetch(`${this.baseUrl}/ai/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`AI query failed: ${response.statusText}`);
    }
    return response.json();
  }

  async viewNotes(request: ViewNotesRequest): Promise<ViewNotesResponse> {
    console.log(`Viewing Notes: ${request.type}...`);
    const response = await fetch(`${this.baseUrl}/view-notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Failed to view notes: ${response.statusText}`);
    }
    return response.json();
  }
}
