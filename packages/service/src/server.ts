import fastify from 'fastify';
import {
  ServiceStatus,
  SyncRequest,
  LogsResponse,
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
} from '@notes-sync/shared';
import { ServiceConfig } from './config';
import { Logger } from './logger';

import { NoteInteractor } from './note-interactor';

export function createServer(
  config: ServiceConfig,
  scheduleSync: (reason: string) => void,
  noteInteractor: NoteInteractor
) {
  const server = fastify({ logger: true });
  let lastSyncTime = new Date().toISOString();

  let onAddNote: Array<() => Promise<string>> = [];

  // GET /status - Service status
  server.get<{ Reply: ServiceStatus }>('/status', async (request, reply) => {
    return {
      running: true,
      watching: config.notesDir,
      lastSync: lastSyncTime,
      uptime: process.uptime(),
    };
  });

  // POST /sync - Trigger sync
  server.post<{ Body: SyncRequest }>('/sync', async (request, reply) => {
    Logger.log('Manual sync requested:', request.body);
    const reason = request.body?.force ? 'manual-force' : 'manual';
    scheduleSync(reason);
    lastSyncTime = new Date().toISOString();
    return { success: true };
  });

  // GET /logs - Get service logs
  server.get<{ Reply: LogsResponse }>('/logs', async (request, reply) => {
    // TODO: Implement actual log reading from files
    return {
      logs: [
        'Service started',
        `File watcher initialized for ${config.notesDir}`,
        `Watching ${config.glob} pattern`,
        `Last sync: ${lastSyncTime}`,
      ],
      total: 4,
    };
  });

  server.post<{ Body: { text: string } }>(
    '/add-note',
    async (request, reply) => {
      Logger.log('Add note requested via API');
      await noteInteractor.addNote(request.body.text);
      return { message: 'Added note' };
    }
  );

  // POST /shutdown - Graceful shutdown
  server.post('/shutdown', async (request, reply) => {
    Logger.log('Shutdown requested via API');
    setTimeout(() => process.exit(0), 1000);
    return { message: 'Shutting down...' };
  });

  // POST /add-todo - Add a new todo to today's focus
  server.post<{ Body: AddTodoRequest }>('/add-todo', async (request, reply) => {
    Logger.log('Add todo requested via API');
    await noteInteractor.addTodo(request.body.text);
    return { message: 'Todo added' };
  });

  // POST /mark-todo-complete - Mark a todo as completed
  server.post<{
    Body: MarkTodoCompleteRequest;
    Reply: MarkTodoCompleteResponse;
  }>('/mark-todo-complete', async (request, reply) => {
    Logger.log(`Mark todo complete requested: ${request.body.todoText}`);
    const success = noteInteractor.markTodoComplete(request.body.todoText);
    return { success };
  });

  // POST /delete-todo - Delete a todo entirely
  server.post<{ Body: DeleteTodoRequest; Reply: DeleteTodoResponse }>(
    '/delete-todo',
    async (request, reply) => {
      Logger.log(`Delete todo requested: ${request.body.todoText}`);
      const success = noteInteractor.deleteTodo(request.body.todoText);
      return {
        success,
        message: success ? 'Todo deleted successfully' : 'Todo not found',
      };
    }
  );

  // POST /search-notes - Search through notes
  server.post<{ Body: SearchNotesRequest; Reply: SearchNotesResponse }>(
    '/search-notes',
    async (request, reply) => {
      Logger.log(`Search notes requested: ${request.body.query}`);
      const results = noteInteractor.searchNotes(
        request.body.query,
        request.body.daysBack
      );
      return { results };
    }
  );

  // GET /incomplete-todos - Get incomplete todos
  server.get<{
    Querystring: { daysBack?: string };
    Reply: GetIncompleteTodosResponse;
  }>('/incomplete-todos', async (request, reply) => {
    const daysBack = request.query.daysBack
      ? parseInt(request.query.daysBack)
      : undefined;
    Logger.log(`Get incomplete todos requested: ${daysBack || 7} days back`);
    const todos = noteInteractor.getIncompleteTodos(daysBack);
    return { todos };
  });

  // POST /archive-completed-todos - Archive completed todos
  server.post<{ Reply: ArchiveCompletedTodosResponse }>(
    '/archive-completed-todos',
    async (request, reply) => {
      Logger.log('Archive completed todos requested');
      const archivedCount = noteInteractor.archiveCompletedTodos();
      return { archivedCount };
    }
  );

  // POST /format-document - Format the entire document
  server.post<{ Reply: FormatDocumentResponse }>(
    '/format-document',
    async (request, reply) => {
      Logger.log('Format document requested');
      const result = noteInteractor.formatDocument();
      return result;
    }
  );

  // POST /format-section - Format a specific section
  server.post<{ Body: FormatSectionRequest; Reply: FormatSectionResponse }>(
    '/format-section',
    async (request, reply) => {
      Logger.log(`Format section requested: ${request.body.sectionName}`);
      const success = noteInteractor.formatSection(request.body.sectionName);
      return { success };
    }
  );

  // GET /validate-formatting - Check document for formatting issues
  server.get<{ Reply: ValidateFormattingResponse }>(
    '/validate-formatting',
    async (request, reply) => {
      Logger.log('Validate formatting requested');
      const result = noteInteractor.validateFormatting();
      return result;
    }
  );

  // GET /daily-status - Check daily section status
  server.get<{ Reply: DailyStatusResponse }>(
    '/daily-status',
    async (request, reply) => {
      Logger.log('Daily status requested');
      const hasToday = noteInteractor.hasTodaySection();
      const missingDays = noteInteractor.checkForMissingDays();
      const timeSinceLastEntry = noteInteractor.getTimeSinceLastEntry();

      return { hasToday, missingDays, timeSinceLastEntry };
    }
  );

  // POST /create-daily - Force create daily section
  server.post<{ Body: CreateDailyRequest; Reply: CreateDailyResponse }>(
    '/create-daily',
    async (request, reply) => {
      Logger.log('Manual daily section creation requested');
      const result = await noteInteractor.autoCreateDailySection(
        request.body?.force
      );

      if (result.created) {
        scheduleSync('manual-daily-creation');
      }

      return result;
    }
  );

  server.post<{ Body: ViewNotesRequest; Reply: ViewNotesResponse }>(
    '/view-notes',
    async (request, reply) => {
      Logger.log(`View notes requested: ${request.body.type}`);

      try {
        const content = await noteInteractor.viewNotes(request.body);
        return content;
      } catch (error) {
        Logger.error(`View notes failed: ${(error as Error).message}`);
        reply.code(500);
        return {
          content: 'Error: Could not retrieve notes',
          metadata: {
            type: request.body.type,
            totalLines: 0,
          },
        };
      }
    }
  );

  server.post<{ Body: AIQueryRequest; Reply: AIQueryResponse }>(
    '/ai/query',
    async (request, reply) => {
      Logger.log(
        `AI Query: "${request.body.query}" (${JSON.stringify(request.body.timeRange)})`
      );

      try {
        const response = await noteInteractor.processAIQuery(request.body);
        return response;
      } catch (error) {
        Logger.error(`AI query failed: ${(error as Error).message}`);
        reply.code(500);
        return {
          response:
            'Sorry, I encountered an error analyzing your notes. Please try again.',
          contextUsed: { daysCovered: 0, charactersUsed: 0, truncated: false },
        };
      }
    }
  );

  return server;
}
