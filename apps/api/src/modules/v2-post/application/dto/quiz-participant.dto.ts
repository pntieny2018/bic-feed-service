export class QuizParticipantDto {
  public id: string;
  public quizId: string;
  public contentId: string;
  public timeLimit: number;
  public startedAt: Date;
  public createdAt: Date;
  public updatedAt: Date;
  public score?: number;
  public totalAnswers?: number;
  public totalCorrectAnswers?: number;
  public finishedAt?: Date;
  public constructor(data: Partial<QuizParticipantDto>) {
    Object.assign(this, data);
  }
}
