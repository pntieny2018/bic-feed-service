import { Injectable } from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';
import { ConfigService } from '@nestjs/config';
import { IOpenAIConfig } from '@app/openai/config/openai-config.interface';
import {
  GenerateQuestionProps,
  GenerateQuestionResponse,
  IOpenaiService,
} from '@app/openai/openai.service.interface';

@Injectable()
export class OpenaiService implements IOpenaiService {
  private _openAI;
  public constructor(configService: ConfigService) {
    const openAIConfig = configService.get<IOpenAIConfig>('openai');
    const configuration = new Configuration({
      apiKey: openAIConfig.apiKey,
    });
    this._openAI = new OpenAIApi(configuration);
  }

  public async generateQuestion(props: GenerateQuestionProps): Promise<GenerateQuestionResponse[]> {
    return [
      {
        question: 'What is human life expectancy in the United States?',
        answers: [
          {
            content: '78 years',
            isCorrect: false,
          },
        ],
      },
    ];
  }
}
