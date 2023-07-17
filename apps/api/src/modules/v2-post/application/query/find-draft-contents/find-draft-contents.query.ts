import { IQuery } from '@nestjs/cqrs';
import { PostType } from '../../../data-type';
import { OrderEnum } from '../../../../../common/dto';
import { UserDto } from '../../../../v2-user/application';

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
