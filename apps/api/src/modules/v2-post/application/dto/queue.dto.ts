export class QuizParticipantResultJobDto {
  public quizParticipantId: string;

  public constructor(data: Partial<QuizParticipantResultJobDto>) {
    Object.assign(this, data);
  }
}
