import { ICommand } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

export type GenerateQuizCommandPayload = {
  quizId: string;
  authUser: UserDto;
};
export class GenerateQuizCommand implements ICommand {
  public constructor(public readonly payload: GenerateQuizCommandPayload) {}
}
