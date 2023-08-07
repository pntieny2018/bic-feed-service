import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

export type DeleteQuizQuestionCommandPayload = {
  questionId: string;
  authUser: UserDto;
};
export class DeleteQuizQuestionCommand implements ICommand {
  public constructor(public readonly payload: DeleteQuizQuestionCommandPayload) {}
}
