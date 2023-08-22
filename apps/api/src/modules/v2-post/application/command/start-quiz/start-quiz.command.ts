import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

export type StartQuizCommandPayload = {
  quizId: string;
  authUser: UserDto;
};
export class StartQuizCommand implements ICommand {
  public constructor(public readonly payload: StartQuizCommandPayload) {}
}
