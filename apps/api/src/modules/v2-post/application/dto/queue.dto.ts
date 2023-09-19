export class QuizParticipantResultJobDto {
  public quizParticipantId: string;

  public constructor(data: Partial<QuizParticipantResultJobDto>) {
    Object.assign(this, data);
  }
}

export class ContentScheduledJobDto {
  public contentId: string;
  public ownerId: string;

  public constructor(data: Partial<ContentScheduledJobDto>) {
    Object.assign(this, data);
  }
}
