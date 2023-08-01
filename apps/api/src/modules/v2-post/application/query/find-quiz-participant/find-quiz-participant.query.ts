import { IQuery } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';

type Props = {
  authUser: UserDto;
  quizParticipantId: string;
};

export class FindQuizParticipantQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
