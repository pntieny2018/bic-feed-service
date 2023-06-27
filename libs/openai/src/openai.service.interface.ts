export type GenerateQuestionProps = {
  content: string;
  numberOfQuestions: number;
  numberOfAnswers: number;
};

export type GenerateQuestionResponse = {
  model: string;
  context: {
    role: string;
    content: string;
  }[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  questions: {
    question: string;
    answers: {
      answer: string;
      isCorrect: boolean;
    }[];
  }[];
};
export interface IOpenaiService {
  generateQuestion(props: GenerateQuestionProps): Promise<GenerateQuestionResponse>;
}
export const OPEN_AI_SERVICE_TOKEN = 'OPEN_AI_SERVICE_TOKEN';
