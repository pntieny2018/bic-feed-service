import { CONTENT_TYPE } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import { IQuery } from '@nestjs/cqrs';

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
