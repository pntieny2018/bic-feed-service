import { Injectable } from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';
import { ConfigService } from '@nestjs/config';
import { IOpenAIConfig } from '@app/openai/config/openai-config.interface';
import {
  GenerateQuestionProps,
  GenerateQuestionResponse,
  IOpenaiService,
} from '@app/openai/openai.service.interface';
import {
  MAX_COMPLETION_TOKEN,
  MAX_TOKEN,
  TOKEN_IN_CONTEXT,
  TOKEN_PER_QUESTION_OR_ANSWER,
} from '@app/openai/constant';

@Injectable()
export class OpenaiService implements IOpenaiService {
  private _openAI;
  private _model = {
    gpt_4k: 'gpt-3.5-turbo',
    gpt_16k: 'gpt-3.5-turbo-16k',
  };
  public constructor(private readonly _configService: ConfigService) {}

  public async generateQuestion(props: GenerateQuestionProps): Promise<GenerateQuestionResponse> {
    const inputTokens = this._getInputTokens(props);

    const completionTokens = this._getCompletionTokens(props);
    if (completionTokens >= MAX_COMPLETION_TOKEN) {
      throw new Error(
        `The number of tokens in questions and answers cannot exceed ${MAX_COMPLETION_TOKEN} tokens`
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
      console.log('completion', JSON.stringify(completion.data));
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
      throw new Error(e.response.data.error.message);
    }
  }

  private _getQuestions(content: string): any {
    try {
      const items = JSON.parse(content);
      return items.map((item) => ({
        question: item.question,
        answers: item.answers.map((item) => ({
          answer: item.answer,
          isCorrect: item.isCorrect || false,
        })),
      }));
    } catch (e) {
      return [];
    }
  }
  private _getInputTokens(props: GenerateQuestionProps): number {
    const { content } = props;
    const tokenInContent = content.length; //TODO: get from lambda
    return TOKEN_IN_CONTEXT + tokenInContent;
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
        content: `Read the article:`,
      },
      {
        role: 'system',
        content: `<article>${content}</article>`,
      },
      {
        role: 'system',
        content: `1. Generate ${numQuestion} multiple-choice questions with ${numAnswer} choices each with 1 and only 1 correct choice. It is very important that the language of all questions and choices must be the same as the detected language.\n
        2. Each question must start with the exact format "[{question number}]" where {question number} is a number. Each choice in a multiple-choice question must start exactly with "{alphabet})" where {alphabet} can be A, B, C, etc. It is very important that each choice must be present in the required format.\n
        3. Right after each question and before the next question, provide only the alphabet of the correct choice with the exact format "=> {alphabet}" where {alphabet} can be A, B, C, etc.\n
        4. The questions should be geared towards a general audience and should focus on factual information from the article.\n
        5. All your responses must be in the detected language of the above article.`,
      },
    ];
    // return [
    //   {
    //     role: 'user',
    //     content: `Read the following article and then following THE STEP-BY-STEP INSTRUCTIONS after the end of the article:\n\n
    // === Start of the article ===\n\n
    // ${content}
    // \n\n=== End of the article ===\n\nSTEP-BY-STEP INSTRUCTIONS\n\n
    // 1. Generate ${numQuestion} multiple-choice questions with ${numAnswer} choices each with 1 and only 1 correct choice. It is very important that the language of all questions and choices must be the same as the detected language.\n
    // 2. Each question must start with the exact format "[{question number}]" where {question number} is a number. Each choice in a multiple-choice question must start exactly with "{alphabet})" where {alphabet} can be A, B, C, etc. It is very important that each choice must be present in the required format.\n
    // 3. Right after each question and before the next question, provide only the alphabet of the correct choice with the exact format "=> {alphabet}" where {alphabet} can be A, B, C, etc.\n
    // 4. The questions should be geared towards a general audience and should focus on factual information from the article.\n
    // 5. All your responses must be in the detected language of the above article.`,
    //   },
    // ];
  }

  private _getQuestionFromText(text: string): {
    question: string;
    answers: {
      answer: string;
      isCorrect: boolean;
    }[];
  }[] {
    const lines = text.split('\n');
    const questions = [];
    let currentQuestion = null;

    for (const line of lines) {
      if (line.trim() === '') continue;
      const questionMatch = line.match(/\[(\d+)\] (.+)$/);

      if (questionMatch) {
        if (currentQuestion !== null) questions.push(currentQuestion);

        const questionText = questionMatch[2];
        currentQuestion = { question: questionText, answers: [] };
      }
      const answerMatch = line.match(/^([A-Za-z])\) (.+)$/);
      if (answerMatch && currentQuestion !== null) {
        const answerText = answerMatch[2] ?? '';
        currentQuestion.answers.push({ answer: answerText, isCorrect: false });
      }
      if (line.includes('=>') && currentQuestion !== null) {
        const answerCorrect = line.trim().slice(2).trim();
        const indexAnswerCorrect = answerCorrect.toLowerCase().charCodeAt(0) - 97;
        currentQuestion.answers[indexAnswerCorrect].isCorrect = true;
      }
    }
    if (currentQuestion !== null) questions.push(currentQuestion);

    return questions;
  }
}
