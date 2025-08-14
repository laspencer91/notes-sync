import {
  AIProvider,
  GenerateQuoteRequest,
  GenerateQuoteResponse,
  GenerateQueryRequest,
  GenerateQueryResponse,
  AIError,
  AIRateLimitError,
  AIConfig,
} from "@notes-sync/shared";
import { GoogleGenAI } from "@google/genai";
import { Logger } from "../../logger";

export class GeminiProvider implements AIProvider {
  public readonly name = "gemini";
  private config: AIConfig["features"]["dailyQuotes"];
  private ai: GoogleGenAI;

  constructor(
    private apiKey: string,
    private model: string = "gemini-2.5-flash-lite",
    quoteConfig: AIConfig["features"]["dailyQuotes"],
  ) {
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }

    // Initialize the Google GenAI client
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });

    // Set defaults for quote configuration
    this.config = {
      maxLength: quoteConfig?.maxLength || 30,
      focus: quoteConfig?.focus || ["productivity", "personal growth"],
      adjectives: quoteConfig?.adjectives || ["historical", "motivational"],
      additionalRules: quoteConfig?.additionalRules || [
        "If quoting from spiritual texts, include the book name as author",
        "Prefer wisdom that applies to daily work and life",
      ],
    };
  }

  async generateQuote(
    request: GenerateQuoteRequest,
  ): Promise<GenerateQuoteResponse> {
    try {
      const prompt = this.buildQuotePrompt(request);

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          temperature: 0.8,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 150,
        },
      });

      if (!response.text) {
        throw new AIError("No text content in Gemini API response", this.name);
      }

      const parsed = this.parseQuoteResponse(response.text);

      Logger.log(
        `Generated quote via Gemini: "${parsed.quote}" - ${parsed.author}`,
      );
      return parsed;
    } catch (error) {
      // Handle rate limiting errors
      if (error instanceof Error && error.message.includes("429")) {
        throw new AIRateLimitError(this.name);
      }

      if (error instanceof AIError) {
        throw error;
      }

      Logger.error(
        `Gemini quote generation failed: ${(error as Error).message}`,
      );
      throw new AIError(
        `Failed to generate quote: ${(error as Error).message}`,
        this.name,
      );
    }
  }

  private buildQuotePrompt(request: GenerateQuoteRequest): string {
    if (!this.config) {
      return 'Find a short, daily quote for someone focused on productivity in the format -> "Quote text" - Author Name -> Under 50 characters.';
    }

    const theme = request.theme || "productivity";
    const context = request.context
      ? `\n\nContext about the user's recent work: ${request.context}`
      : "";

    const additionalRulesText = this.config.additionalRules?.length
      ? `\n- ${this.config.additionalRules.join("\n- ")}`
      : "";

    return `Generate a short, daily quote for someone focused on ${this.config.focus?.join(" and ")}. 

Theme: ${theme}
${context}

Requirements:
- Keep it under ${this.config.maxLength} words
- Make it ${this.config.adjectives?.join(" and ")}
- Include the author's name or passage if from spiritual book of unknown author
- Format as: "Quote text" - Author Name
- Avoid cliches and focus on practical wisdom${additionalRulesText}

Examples:
"The man who lies to himself and listens to his own lie comes to a point that he cannot distinguish the truth within him, or around him, and so loses all respect for himself and for others." - Fyodor Dostoyevsky
"Pain is inevitable. Suffering is optional. The difference lies in what we choose to do with our pain." - Haruki Murakami
"Your future self is counting on what you do today" - Unknown

Generate one quote:`;
  }

  async processQuery(
    request: GenerateQueryRequest,
  ): Promise<GenerateQueryResponse> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: request.query,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: request.maxLength || 500,
        },
      });

      if (!response.text) {
        throw new AIError("No text content in Gemini API response", this.name);
      }

      Logger.log(`Processed AI query: ${request.query.substring(0, 50)}...`);

      return {
        response: response.text.trim(),
      };
    } catch (error) {
      // Handle rate limiting errors
      if (error instanceof Error && error.message.includes("429")) {
        throw new AIRateLimitError(this.name);
      }

      if (error instanceof AIError) {
        throw error;
      }

      Logger.error(
        `Gemini query processing failed: ${(error as Error).message}`,
      );
      throw new AIError(
        `Failed to process query: ${(error as Error).message}`,
        this.name,
      );
    }
  }

  private parseQuoteResponse(text: string): GenerateQuoteResponse {
    // Try to parse quote in format: "Quote text" - Author
    const quoteMatch = text.match(/[""]([^"""]+)[""] - (.+)/);
    if (quoteMatch) {
      return {
        quote: quoteMatch[1].trim(),
        author: quoteMatch[2].trim(),
      };
    }

    // Fallback: try to find any quoted text
    const fallbackMatch =
      text.match(/[""]([^"""]+)[""]/) || text.match(/"([^"]+)"/);
    if (fallbackMatch) {
      return {
        quote: fallbackMatch[1].trim(),
        author: "Unknown",
      };
    }

    // Last resort: use the first line and attribute to Unknown
    const firstLine = text.split("\n")[0].trim();
    return {
      quote: firstLine,
      author: "Unknown",
    };
  }
}
