export class QuestionDto {
  public id: string;
  public content: string;
  public answers: {
    id: string;
    content: string;
    isCorrect: boolean;
  }[];
  public constructor(data: Partial<QuestionDto>) {
    Object.assign(this, data);
  }
}
