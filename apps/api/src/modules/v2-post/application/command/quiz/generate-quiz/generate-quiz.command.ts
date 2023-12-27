import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type GenerateQuizCommandPayload = {
  quizId: string;
  authUser: UserDto;
};
export class GenerateQuizCommand implements ICommand {
  public constructor(public readonly payload: GenerateQuizCommandPayload) {}
}
