import { IQuery } from '@nestjs/cqrs';

import { OrderEnum } from '../../../../../common/dto';
import { UserDto } from '../../../../v2-user/application';
import { PostType } from '../../../data-type';

type Props = {
  authUser: UserDto;
  limit: number;
  order: OrderEnum;
  isProcessing?: boolean;
  type?: PostType;
  before?: string;
  after?: string;
};

export class FindDraftContentsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
