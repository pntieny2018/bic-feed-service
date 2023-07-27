import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

export type UpdateQuizAnswerCommandPayload = {
  quizParticipantId: string;
  answers: {
    id?: string;
    questionId: string;
    answerId: string;
  }[];
  authUser: UserDto;
  isFinished?: boolean;
};
export class UpdateQuizAnswerCommand implements ICommand {
  public constructor(public readonly payload: UpdateQuizAnswerCommandPayload) {}
}
