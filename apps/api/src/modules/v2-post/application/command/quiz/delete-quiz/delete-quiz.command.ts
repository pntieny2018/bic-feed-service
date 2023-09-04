import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

export type DeleteQuizCommandPayload = {
  quizId: string;
  authUser: UserDto;
};
export class DeleteQuizCommand implements ICommand {
  public constructor(public readonly payload: DeleteQuizCommandPayload) {}
}
