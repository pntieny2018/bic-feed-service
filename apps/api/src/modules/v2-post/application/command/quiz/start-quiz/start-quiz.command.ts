import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type StartQuizCommandPayload = {
  quizId: string;
  authUser: UserDto;
};
export class StartQuizCommand implements ICommand {
  public constructor(public readonly payload: StartQuizCommandPayload) {}
}
