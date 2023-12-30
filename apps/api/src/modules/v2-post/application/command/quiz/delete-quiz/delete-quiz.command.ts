import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type DeleteQuizCommandPayload = {
  quizId: string;
  authUser: UserDto;
};
export class DeleteQuizCommand implements ICommand {
  public constructor(public readonly payload: DeleteQuizCommandPayload) {}
}
