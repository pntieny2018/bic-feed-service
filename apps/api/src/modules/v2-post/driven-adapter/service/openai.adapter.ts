import { IOpenAIService, OPEN_AI_SERVICE_TOKEN } from '@libs/service/openai';
import { Inject, Injectable } from '@nestjs/common';
import {
  IOpenAIAdapter,
  OpenAIGenerateQuestionProps,
  OpenAIGenerateQuestionResponse,
} from '../../domain/service-adapter-interface/openai-adapter.interface';

@Injectable()
export class OpenAIAdapter implements IOpenAIAdapter {
  public constructor(
    @Inject(OPEN_AI_SERVICE_TOKEN)
    private readonly _openAIService: IOpenAIService
  ) {}

  public async generateQuestions(
    input: OpenAIGenerateQuestionProps
  ): Promise<OpenAIGenerateQuestionResponse> {
    const { content, numberOfQuestions, numberOfAnswers } = input;
    const { questions, usage, model, maxTokens, completion } =
      await this._openAIService.generateQuestion({
        content,
        numberOfQuestions,
        numberOfAnswers,
      });

    return {
      questions,
      usage,
      model,
      maxTokens,
      completion,
    };
  }
}
