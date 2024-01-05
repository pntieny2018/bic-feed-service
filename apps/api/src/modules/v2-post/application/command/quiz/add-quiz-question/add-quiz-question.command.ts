import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

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
