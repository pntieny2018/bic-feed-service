export type OpenAIGenerateQuestionProps = {
  content: string;
  numberOfQuestions: number;
  numberOfAnswers: number;
};

export type OpenAIGenerateQuestionResponse = {
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  maxTokens: number;
  completion: any;
  questions: {
    id: string;
    content: string;
    answers: {
      id: string;
      content: string;
      isCorrect: boolean;
    }[];
  }[];
};

export interface IOpenAIAdapter {
  generateQuestions(input: OpenAIGenerateQuestionProps): Promise<OpenAIGenerateQuestionResponse>;
}

export const OPEN_AI_ADAPTER = 'OPEN_AI_ADAPTER';
