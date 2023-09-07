import { IHttpService, LAMBDA_COUNT_TOKEN_HTTP_TOKEN } from '@libs/infra/http';
import { IOpenAIConfig } from '@libs/service/openai/config';
import {
  CORRECT_ANSWER_KEY,
  MAX_TOKEN,
  TOKEN_IN_CONTEXT,
  TOKEN_PER_QUESTION_OR_ANSWER,
  LAMBDA_COUNT_TOKEN_ENDPOINT,
} from '@libs/service/openai/constant';
import {
  GenerateQuestionProps,
  GenerateQuestionResponse,
  IOpenaiService,
} from '@libs/service/openai/openai.service.interface';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration, OpenAIApi } from 'openai';
import { v4 } from 'uuid';

@Injectable()
export class OpenAIService implements IOpenaiService {
  private _openAI;
  private _model = {
    gpt_4k: 'gpt-3.5-turbo',
    gpt_16k: 'gpt-3.5-turbo-16k',
  };
  public constructor(
    private readonly _configService: ConfigService,
    @Inject(LAMBDA_COUNT_TOKEN_HTTP_TOKEN)
    private readonly _httpService: IHttpService
  ) {}

  public async generateQuestion(props: GenerateQuestionProps): Promise<GenerateQuestionResponse> {
    const inputTokens = await this._getInputTokens(props);

    const completionTokens = this._getCompletionTokens(props);
    if (props.numberOfQuestions <= 0 || props.numberOfAnswers <= 0) {
      throw new Error('The number of questions and answers must be greater than 0');
    }

    if (completionTokens >= MAX_TOKEN - inputTokens) {
      throw new Error(
        `The number of tokens in questions and answers cannot exceed ${
          MAX_TOKEN - inputTokens
        } tokens`
      );
    }

    const remainingTokens = MAX_TOKEN - completionTokens;
    if (inputTokens > remainingTokens) {
      throw new Error(`The number of tokens in content cannot exceed ${remainingTokens} tokens`);
    }

    const messages = this._getContext({
      content: props.content,
      numQuestion: props.numberOfQuestions,
      numAnswer: props.numberOfAnswers,
    });

    const model = this._getModel(inputTokens + completionTokens);
    const openAIConfig = this._configService.get<IOpenAIConfig>('openai');
    const configuration = new Configuration({
      apiKey: openAIConfig.apiKey,
    });

    try {
      this._openAI = new OpenAIApi(configuration);
      const completion = await this._openAI.createChatCompletion({
        model,
        messages,
        max_tokens: completionTokens,
      });
      const questions = this._getQuestionFromText(completion.data.choices[0].message.content);
      return {
        usage: {
          promptTokens: completion.data.usage.prompt_tokens,
          completionTokens: completion.data.usage.completion_tokens,
          totalTokens: completion.data.usage.total_tokens,
        },
        questions,
        model,
        maxTokens: completionTokens,
        completion: completion.data,
      };
    } catch (e) {
      throw e;
    }
  }

  private async _getInputTokens(props: GenerateQuestionProps): Promise<number> {
    try {
      const { content } = props;
      const response = await this._httpService.post(LAMBDA_COUNT_TOKEN_ENDPOINT, {
        content,
      });
      return +response.data + TOKEN_IN_CONTEXT;
    } catch (e) {
      throw e;
    }
  }

  private _getCompletionTokens(props: GenerateQuestionProps): number {
    const { numberOfQuestions, numberOfAnswers } = props;
    return numberOfQuestions * (numberOfAnswers + 1) * TOKEN_PER_QUESTION_OR_ANSWER;
  }

  private _getModel(totalTokens: number): string {
    if (totalTokens <= 4000) {
      return this._model.gpt_4k;
    } else {
      return this._model.gpt_16k;
    }
  }

  private _getContext(input: {
    content: string;
    numQuestion: number;
    numAnswer: number;
  }): { role: string; content: string }[] {
    const { content, numQuestion, numAnswer } = input;
    return [
      {
        role: 'system',
        content: `You are quiz creator. You will be provided an article (delimited with XML tags).
                    Please read the article and create ${numQuestion} questions, each question must have ${numAnswer} answer choices and indicate which answer is correct. 
                    The language of all the questions and answers must be the same as the article.\n
                  Follow this format:\n
                  """" 
                  [1] <question 1>
                  a) <choice 1>
                  b) <choice 2>
                  c) <choice 3>
                  ${CORRECT_ANSWER_KEY} a
                  [2] <question 2>
                  a) <choice 1>
                  b) <choice 2>
                  c) <choice 3>
                  ${CORRECT_ANSWER_KEY} c
                  """"`,
      },
      {
        role: 'user',
        content: `<article>${content}</article>`,
      },
    ];
  }

  private _getQuestionFromText(text: string): {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    answers: {
      id: string;
      content: string;
      isCorrect: boolean;
      createdAt: Date;
      updatedAt: Date;
    }[];
  }[] {
    const lines = text.split('\n');
    const questions = [];
    let currentQuestion = null;

    for (const line of lines) {
      if (line.trim() === '') {
        continue;
      }
      const questionMatch = line.match(/\[(\d+)\] (.+)$/);

      if (questionMatch) {
        if (currentQuestion !== null) {
          questions.push(currentQuestion);
        }

        const questionText = questionMatch[2];
        currentQuestion = {
          id: v4(),
          content: questionText,
          createdAt: new Date(),
          updatedAt: new Date(),
          answers: [],
        };
      }
      const answerMatch = line.match(/([A-Za-z])\) (.+)$/);
      if (answerMatch && currentQuestion !== null) {
        const answerText = answerMatch[2] ?? '';
        currentQuestion.answers.push({
          id: v4(),
          content: answerText,
          isCorrect: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      if (line.includes(CORRECT_ANSWER_KEY) && currentQuestion !== null) {
        const answerCorrect = line.trim().slice(CORRECT_ANSWER_KEY.length).trim();
        const indexAnswerCorrect = answerCorrect.toLowerCase().charCodeAt(0) - 97;
        if (currentQuestion.answers[indexAnswerCorrect]) {
          currentQuestion.answers[indexAnswerCorrect].isCorrect = true;
        }
      }
    }
    if (currentQuestion !== null) {
      questions.push(currentQuestion);
    }

    return questions;
  }
}
