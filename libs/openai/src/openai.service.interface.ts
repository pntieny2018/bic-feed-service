export type GenerateQuestionProps = {
  content: string;
  numberOfQuestions: number;
  numberOfAnswers: number;
};

export type GenerateQuestionResponse = {
  question: string;
  answers: {
    content: string;
    isCorrect: boolean;
  }[];
};
export interface IOpenaiService {
  generateQuestion(props: GenerateQuestionProps): Promise<GenerateQuestionResponse[]>;
}
