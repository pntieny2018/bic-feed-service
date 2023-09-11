import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type DeleteQuizQuestionCommandPayload = {
  quizId: string;
  questionId: string;
  authUser: UserDto;
};
export class DeleteQuizQuestionCommand implements ICommand {
  public constructor(public readonly payload: DeleteQuizQuestionCommandPayload) {}
}
