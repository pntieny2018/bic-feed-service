export class QuizQuestionDto {
  public id: string;
  public content: string;
  public answers: {
    id: string;
    content: string;
    isCorrect: boolean;
  }[];
  public constructor(data: Partial<QuizQuestionDto>) {
    Object.assign(this, data);
  }
}
