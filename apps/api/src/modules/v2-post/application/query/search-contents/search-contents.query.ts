import { IQuery } from '@nestjs/cqrs';
import { UserDto } from '../../../../v2-user/application';
import { PostType } from '../../../data-type';

type Props = {
  authUser: UserDto;

  actors?: string[];

  keyword?: string;

  tags?: string[];

  topics?: string[];

  startTime?: string;

  endTime?: string;

  groupId?: string;

  contentTypes?: PostType[];

  limit?: number;

  after?: string;

  isIncludedInnerGroups?: boolean;
};

export class SearchContentsQuery implements IQuery {
  public constructor(public readonly payload: Props) {}
}
