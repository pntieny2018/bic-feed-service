import { ORDER } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  authUser: UserDto;
  contentId: string;
  limit: number;
  order: ORDER;
  before?: string;
  after?: string;
};

export class FindQuizParticipantsSummaryDetailQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
