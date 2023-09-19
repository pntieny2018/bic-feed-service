export type GenerateQuestionProps = {
  content: string;
  numberOfQuestions: number;
  numberOfAnswers: number;
};
export type Question = {
  id: string;
  content: string;
  answers: {
    id: string;
    content: string;
    isCorrect: boolean;
  }[];
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
  questions: Question[];
};
export interface IOpenAIService {
  generateQuestion(props: GenerateQuestionProps): Promise<GenerateQuestionResponse>;
}
export const OPEN_AI_SERVICE_TOKEN = 'OPEN_AI_SERVICE_TOKEN';
