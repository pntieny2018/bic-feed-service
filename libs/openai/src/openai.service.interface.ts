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
    question: string;
    answers: {
      id: string;
      answer: string;
      isCorrect: boolean;
    }[];
  }[];
};
export interface IOpenaiService {
  generateQuestion(props: GenerateQuestionProps): Promise<GenerateQuestionResponse>;
}
export const OPEN_AI_SERVICE_TOKEN = 'OPEN_AI_SERVICE_TOKEN';
