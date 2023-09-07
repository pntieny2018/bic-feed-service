import {
  GenerateQuestionProps,
  GenerateQuestionResponse,
  IOpenaiService,
  OPEN_AI_SERVICE_TOKEN,
} from '@libs/service/openai';
import { Inject, Injectable } from '@nestjs/common';

import { IOpenAIAdapter } from '../../domain/service-adapter-interface';

@Injectable()
export class OpenAIAdapter implements IOpenAIAdapter {
  public constructor(
    @Inject(OPEN_AI_SERVICE_TOKEN)
    private readonly _openaiService: IOpenaiService
  ) {}

  public generateQuestion(props: GenerateQuestionProps): Promise<GenerateQuestionResponse> {
    return this._openaiService.generateQuestion(props);
  }
}
