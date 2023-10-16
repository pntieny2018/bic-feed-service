import { CONTENT_TYPE } from '@beincom/constants';
import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

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
