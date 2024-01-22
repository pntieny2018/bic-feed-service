import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  authUser: UserDto;
  quizParticipantId: string;
};

export class FindQuizParticipantQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
