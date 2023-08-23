import { UserDto } from '@libs/service/user';

export class QuizParticipantResultJobDto {
  public quizParticipantId: string;

  public constructor(data: Partial<QuizParticipantResultJobDto>) {
    Object.assign(this, data);
  }
}

export class ContentScheduledJobDto {
  public contentId: string;
  public contentOwner: UserDto;

  public constructor(data: Partial<ContentScheduledJobDto>) {
    Object.assign(this, data);
  }
}
