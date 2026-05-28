import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type GeminiEmbeddingTaskType =
  | 'RETRIEVAL_QUERY'
  | 'RETRIEVAL_DOCUMENT';

@Injectable()
export class GeminiEmbeddingProvider {
  private readonly defaultModel = 'gemini-embedding-001';
  private readonly defaultDimensions = 768;

  constructor(private readonly configService: ConfigService) {}

  getModel(): string {
    return (
      this.configService.get<string>('GEMINI_EMBEDDING_MODEL') ??
      this.defaultModel
    );
  }

  getDimensions(): number {
    return (
      Number(this.configService.get<string>('GEMINI_EMBEDDING_DIMENSIONS')) ||
      this.defaultDimensions
    );
  }

  async embedText(
    text: string,
    taskType: GeminiEmbeddingTaskType,
    title?: string,
  ): Promise<number[]> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured');
    }

    const model = this.getModel();
    const body: Record<string, unknown> = {
      model: `models/${model}`,
      content: {
        parts: [{ text }],
      },
      taskType,
      outputDimensionality: this.getDimensions(),
    };

    if (taskType === 'RETRIEVAL_DOCUMENT' && title) {
      body.title = title;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new InternalServerErrorException(
        `Gemini embedding request failed with status ${response.status}: ${errorText}`,
      );
    }

    const result = await response.json();
    const values = result.embedding?.values;

    if (!Array.isArray(values)) {
      throw new InternalServerErrorException('Gemini embedding response invalid');
    }

    if (values.length !== this.getDimensions()) {
      throw new InternalServerErrorException(
        `Unexpected Gemini embedding dimension: ${values.length}`,
      );
    }

    return values;
  }
}
