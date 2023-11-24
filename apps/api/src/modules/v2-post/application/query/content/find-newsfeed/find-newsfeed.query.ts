import { CONTENT_TYPE } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

type Props = {
  authUser: UserDto;
  isImportant?: boolean;
  isMine?: boolean;
  isSaved?: boolean;
  limit: number;
  after?: string;
  before?: string;
  type?: CONTENT_TYPE;
};
export class FindNewsfeedQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
