export class QuestionDto {
  public question: string;
  public answers: {
    answer: string;
    isCorrect?: boolean;
  }[];
  public constructor(data: Partial<QuestionDto>) {
    Object.assign(this, data);
  }
}
