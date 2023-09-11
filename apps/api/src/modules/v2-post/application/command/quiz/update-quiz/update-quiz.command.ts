import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';
import { QUIZ_STATUS } from '@beincom/constants';

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
