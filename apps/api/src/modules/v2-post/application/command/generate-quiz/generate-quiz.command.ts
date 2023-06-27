import { ICommand } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

export type CreateQuizCommandPayload = {
  quizId: string;
  numberOfQuestions?: number;
  numberOfAnswers?: number;
  authUser: UserDto;
};
export class GenerateQuizCommand implements ICommand {
  public constructor(public readonly payload: CreateQuizCommandPayload) {}
}
