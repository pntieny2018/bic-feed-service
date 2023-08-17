import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../v2-user/application';
import { QuizStatus } from '../../../data-type';

export type UpdateQuizCommandPayload = {
  quizId: string;
  numberOfQuestions?: number;
  numberOfAnswers?: number;
  title?: string;
  description?: string;
  numberOfQuestionsDisplay?: number;
  numberOfAnswersDisplay?: number;
  isRandom?: boolean;
  status?: QuizStatus;
  authUser: UserDto;
};
export class UpdateQuizCommand implements ICommand {
  public constructor(public readonly payload: UpdateQuizCommandPayload) {}
}
