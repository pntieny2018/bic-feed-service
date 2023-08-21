import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

export type AddQuizQuestionCommandPayload = {
  quizId: string;
  content: string;
  answers: {
    content: string;
    isCorrect: boolean;
  }[];
  authUser: UserDto;
};
export class AddQuizQuestionCommand implements ICommand {
  public constructor(public readonly payload: AddQuizQuestionCommandPayload) {}
}
