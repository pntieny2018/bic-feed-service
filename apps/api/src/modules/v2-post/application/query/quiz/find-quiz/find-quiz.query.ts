import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  authUser: UserDto;
  quizId: string;
};

export class FindQuizQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
