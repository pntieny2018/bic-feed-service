export type GenerateQuestionProps = {
  content: string;
  numberOfQuestions: number;
  numberOfAnswers: number;
};

export type GenerateQuestionResponse = {
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
export interface IOpenAIService {
  generateQuestion(props: GenerateQuestionProps): Promise<GenerateQuestionResponse>;
}
export const OPEN_AI_SERVICE_TOKEN = 'OPEN_AI_SERVICE_TOKEN';
