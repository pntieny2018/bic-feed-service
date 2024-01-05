import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type UpdateQuizQuestionCommandPayload = {
  quizId: string;
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
