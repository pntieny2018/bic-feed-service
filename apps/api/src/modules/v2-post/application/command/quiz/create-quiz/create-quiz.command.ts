import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type CreateQuizCommandPayload = {
  contentId: string;
  numberOfQuestions: number;
  numberOfAnswers: number;
  authUser: UserDto;
  title?: string;
  description?: string;
  numberOfQuestionsDisplay?: number;
  isRandom?: boolean;
};
export class CreateQuizCommand implements ICommand {
  public constructor(public readonly payload: CreateQuizCommandPayload) {}
}
