import { ICommand } from '@nestjs/cqrs';
import { QUIZ_STATUS } from '@beincom/constants';
import { UserDto } from '@libs/service/user';

export type UpdateQuizCommandPayload = {
  quizId: string;
  numberOfQuestions?: number;
  numberOfAnswers?: number;
  title?: string;
  description?: string;
  numberOfQuestionsDisplay?: number;
  isRandom?: boolean;
  status?: QUIZ_STATUS;
  authUser: UserDto;
};
export class UpdateQuizCommand implements ICommand {
  public constructor(public readonly payload: UpdateQuizCommandPayload) {}
}
