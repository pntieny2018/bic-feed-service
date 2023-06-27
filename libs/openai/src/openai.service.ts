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
  private _model = {
    gpt_4k: 'gpt-3.5-turbo',
    gpt_16k: 'gpt-3.5-turbo-16k',
  };
  public constructor(private readonly _configService: ConfigService) {}

  public async generateQuestion(props: GenerateQuestionProps): Promise<GenerateQuestionResponse> {
    if (props.content.length > 16000) throw new Error('Max length is 16000 characters');

    const messages = this._getContext({
      content: props.content,
      numQuestion: props.numberOfQuestions,
      numAnswer: props.numberOfAnswers,
    });
    const model = this._getModel(props);
    const openAIConfig = this._configService.get<IOpenAIConfig>('openai');
    const configuration = new Configuration({
      apiKey: openAIConfig.apiKey,
    });

    try {
      this._openAI = new OpenAIApi(configuration);
      const completion = await this._openAI.createChatCompletion({
        model,
        messages,
        max_tokens: this._getLimitTokenCompletion(props),
      });
      console.log(completion);
      return {
        usage: {
          promptTokens: completion.data.usage.prompt_tokens,
          completionTokens: completion.data.usage.completion_tokens,
          totalTokens: completion.data.usage.total_tokens,
        },
        questions: JSON.parse(completion.data.choices[0].message.content),
        model,
        context: messages,
      };
    } catch (e) {
      console.log(e);
    }
  }

  private _getModel(props: GenerateQuestionProps): string {
    const { content } = props;
    if (content.length <= 2000) {
      return this._model.gpt_4k;
    } else {
      //return this._model.gpt_16k;
      return this._model.gpt_4k;
    }
  }

  private _getLimitTokenCompletion(props: GenerateQuestionProps): number {
    const { content } = props;
    if (content.length <= 2000) {
      return 2000;
    } else {
      return 8000;
    }
  }

  private _getContext(input: {
    content: string;
    numQuestion: number;
    numAnswer: number;
  }): { role: string; content: string }[] {
    const { content, numQuestion, numAnswer } = input;
    const jsonFormat =
      '```[{"question":"What is the purpose of the article?","answers":[{"answer":"Tom","isCorrect":true},{"answer":"Tom","isCorrect":false}]}]```';
    return [
      {
        role: 'system',
        content: `Read article from user then create ${numQuestion} questions with ${numAnswer} answer choices per question, include correct answer. 
        You must response in the same language as the article. Follow json format: ${jsonFormat}`,
      },
      {
        role: 'user',
        content,
      },
    ];
  }
}
