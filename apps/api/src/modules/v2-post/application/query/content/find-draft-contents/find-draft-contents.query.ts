import { CONTENT_TYPE, ORDER } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  authUser: UserDto;
  limit: number;
  order: ORDER;
  isProcessing?: boolean;
  type?: CONTENT_TYPE;
  before?: string;
  after?: string;
};

export class FindDraftContentsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
