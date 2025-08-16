import {
  AIConfig,
  AIProvider,
  GenerateQuoteRequest,
  GenerateQuoteResponse,
  GenerateQueryRequest,
  AIError,
} from '@notes-sync/shared';
import { GeminiProvider } from './providers/gemini-provider';
import { Logger } from '../logger';
import { FALLBACK_QUOTES } from './fallback-quotes';

export class AIService {
  private provider?: AIProvider;
  private lastQuoteTime = 0;
  private quoteCooldownMs = 60000; // 1 minute cooldown between quotes

  constructor(private config: AIConfig) {
    if (config.enabled && config.apiKey) {
      this.initializeProvider();
    } else if (config.enabled) {
      Logger.log(
        'AI enabled but no API key provided - quotes will be disabled'
      );
    }
  }

  private initializeProvider(): void {
    try {
      switch (this.config.provider) {
        case 'gemini':
          this.provider = new GeminiProvider(
            this.config.apiKey!,
            this.config.model,
            this.config.features.dailyQuotes
          );
          Logger.log(
            `AI Service initialized with ${this.config.provider} provider`
          );
          break;
        default:
          throw new Error(`Unsupported AI provider: ${this.config.provider}`);
      }
    } catch (error) {
      Logger.error(
        `Failed to initialize AI provider: ${(error as Error).message}`
      );
      this.provider = undefined;
    }
  }

  public isEnabled(): boolean {
    return this.config.enabled && !!this.provider;
  }

  public isDailyQuotesEnabled(): boolean {
    return this.isEnabled() && this.config.features.dailyQuotes != undefined;
  }

  async generateDailyQuote(
    context?: string
  ): Promise<GenerateQuoteResponse | null> {
    if (!this.isDailyQuotesEnabled()) {
      return null;
    }

    // Rate limiting: don't generate quotes too frequently
    const now = Date.now();
    if (now - this.lastQuoteTime < this.quoteCooldownMs) {
      Logger.log('Skipping quote generation due to cooldown');
      return null;
    }

    try {
      const request: GenerateQuoteRequest = {
        theme: 'productivity',
        context: context ? context.substring(0, 500) : undefined, // Limit context length
      };

      const quote = await this.provider!.generateQuote(request);
      this.lastQuoteTime = now;

      return quote;
    } catch (error) {
      if (error instanceof AIError) {
        Logger.error(
          `AI quote generation failed: ${error.message} (${error.provider})`
        );
      } else {
        Logger.error(
          `Unexpected error generating quote: ${(error as Error).message}`
        );
      }

      // Return null instead of throwing - we don't want AI failures to break daily creation
      return null;
    }
  }

  // Fallback quotes for when AI is unavailable
  private getFallbackQuote(): GenerateQuoteResponse {
    const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
    return FALLBACK_QUOTES[randomIndex];
  }

  async generateQuoteWithFallback(
    context?: string
  ): Promise<GenerateQuoteResponse> {
    const aiQuote = await this.generateDailyQuote(context);

    if (aiQuote) {
      return aiQuote;
    }

    // Use fallback quote if AI is unavailable
    Logger.log('Using fallback quote - AI unavailable');
    return this.getFallbackQuote();
  }

  async processQuery(prompt: string): Promise<string> {
    if (!this.isEnabled()) {
      throw new Error('AI query processing requires AI to be enabled');
    }

    try {
      const request: GenerateQueryRequest = {
        query: prompt,
        context: '', // Context is already in the prompt
        maxLength: 500, // Longer responses for analysis
      };

      const response = await this.provider!.processQuery(request);
      this.lastQuoteTime = Date.now(); // Update rate limiting

      return response.response;
    } catch (error) {
      Logger.error(`AI query processing failed: ${(error as Error).message}`);
      throw new AIError(
        `Failed to process query: ${(error as Error).message}`,
        this.config.provider
      );
    }
  }
}
