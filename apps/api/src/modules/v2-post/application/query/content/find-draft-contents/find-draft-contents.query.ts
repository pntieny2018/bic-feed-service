import { CONTENT_TYPE, ORDER } from '@beincom/constants';
import { IQuery } from '@nestjs/cqrs';

import { OrderEnum } from '../../../../../../common/dto';
import { UserDto } from '../../../../../v2-user/application';

type Props = {
  authUser: UserDto;
  limit: number;
  order: OrderEnum | ORDER;
  isProcessing?: boolean;
  type?: CONTENT_TYPE;
  before?: string;
  after?: string;
};

export class FindDraftContentsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
