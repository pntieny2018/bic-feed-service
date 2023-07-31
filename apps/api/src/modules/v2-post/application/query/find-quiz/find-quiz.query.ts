import { IQuery } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

type Props = {
  authUser: UserDto;
  quizId: string;
};

export class FindQuizQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
