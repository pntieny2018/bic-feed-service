import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';
import { AnswerUserDto } from '../../../dto';

export type UpdateQuizAnswerCommandPayload = {
  quizParticipantId: string;
  answers: AnswerUserDto[];
  authUser: UserDto;
  isFinished?: boolean;
};
export class UpdateQuizAnswerCommand implements ICommand {
  public constructor(public readonly payload: UpdateQuizAnswerCommandPayload) {}
}
