// AI feature types and interfaces

export interface AIConfig {
  enabled: boolean;
  provider: "gemini"; // Will expand to | 'groq' | 'ollama' in future
  apiKey?: string;
  model?: string;
  features: {
    dailyQuotes?: {
      maxLength?: number;
      focus?: string[];
      adjectives?: string[];
      additionalRules?: string[];
    };
  };
  rateLimiting: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

export interface GenerateQuoteRequest {
  context?: string;
  theme?: "motivational" | "productivity" | "reflection" | "wisdom";
}

export interface GenerateQuoteResponse {
  quote: string;
  author: string;
}

export interface AIProvider {
  name: string;
  generateQuote(request: GenerateQuoteRequest): Promise<GenerateQuoteResponse>;
}

// Error types for AI operations
export class AIError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code?: string,
  ) {
    super(message);
    this.name = "AIError";
  }
}

export class AIRateLimitError extends AIError {
  constructor(provider: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}`, provider, "RATE_LIMIT");
    this.retryAfter = retryAfter;
  }

  retryAfter?: number;
}
