import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../v2-user/application';
import { PostType } from '../../../data-type';

type Props = {
  authUser: UserDto;
  isImportant?: boolean;
  isMine?: boolean;
  isSaved?: boolean;
  limit: number;
  after?: string;
  before?: string;
  type?: PostType;
};
export class FindNewsfeedQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
