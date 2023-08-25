import { ORDER } from '@beincom/constants';
import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

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
