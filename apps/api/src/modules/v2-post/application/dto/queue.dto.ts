import { UserDto } from '@libs/service/user';

export class QuizParticipantResultJobDto {
  public quizParticipantId: string;

  public constructor(data: Partial<QuizParticipantResultJobDto>) {
    Object.assign(this, data);
  }
}

export class ArticleScheduledJobDto {
  public articleId: string;
  public articleOwner: UserDto;

  public constructor(data: Partial<ArticleScheduledJobDto>) {
    Object.assign(this, data);
  }
}
