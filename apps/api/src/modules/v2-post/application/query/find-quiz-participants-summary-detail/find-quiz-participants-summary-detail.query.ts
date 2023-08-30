import { IQuery } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';
import { OrderEnum } from '../../../../../common/dto';

type Props = {
  authUser: UserDto;
  contentId: string;
  limit: number;
  order: OrderEnum;
  before?: string;
  after?: string;
};

export class FindQuizParticipantsSummaryDetailQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
