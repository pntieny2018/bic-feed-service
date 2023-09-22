import { CONTENT_TYPE } from '@beincom/constants';
import { IQuery } from '@nestjs/cqrs';

import { UserDto } from '../../../../../v2-user/application';

type Props = {
  authUser: UserDto;

  actors?: string[];

  keyword?: string;

  tagIds?: string[];

  tagNames?: string[];

  topics?: string[];

  startTime?: string;

  endTime?: string;

  groupId?: string;

  contentTypes?: CONTENT_TYPE[];

  limit?: number;

  after?: string;

  isIncludedInnerGroups?: boolean;
};

export class SearchContentsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
