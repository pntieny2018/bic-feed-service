export class QuizParticipantResultJobDto {
  public quizParticipantId: string;

  public constructor(data: Partial<QuizParticipantResultJobDto>) {
    Object.assign(this, data);
  }
}

export class ArticleScheduledJobDto {
  public articleId: string;
  public articleOwnerId: string;

  public constructor(data: Partial<ArticleScheduledJobDto>) {
    Object.assign(this, data);
  }
}
