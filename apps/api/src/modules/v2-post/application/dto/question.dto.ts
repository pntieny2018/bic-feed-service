export class QuestionDto {
  public id: string;
  public question: string;
  public answers: {
    id: string;
    answer: string;
    isCorrect: boolean;
  }[];
  public constructor(data: Partial<QuestionDto>) {
    Object.assign(this, data);
  }
}
