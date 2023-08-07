import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

export type UpdateQuizQuestionCommandPayload = {
  questionId: string;
  content: string;
  answers: {
    id?: string;
    content: string;
    isCorrect: boolean;
  }[];
  authUser: UserDto;
};
export class UpdateQuizQuestionCommand implements ICommand {
  public constructor(public readonly payload: UpdateQuizQuestionCommandPayload) {}
}
