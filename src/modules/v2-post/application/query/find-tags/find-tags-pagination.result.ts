import { IQueryResult } from '@nestjs/cqrs';
import { GroupDto } from '../../../../v2-group/application';

export class FindTagsPaginationResult implements IQueryResult {
  public readonly rows: {
    id: string;
    groupId: string;
    name: string;
    slug: string;
    totalUsed: number;
    groups: Omit<GroupDto, 'child'>[];
  }[];
  public readonly total: number;
}
