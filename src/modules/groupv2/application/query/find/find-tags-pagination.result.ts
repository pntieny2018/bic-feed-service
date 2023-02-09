import { IQueryResult } from '@nestjs/cqrs';
import { GroupSharedDto } from '../../../../../shared/group/dto';

export class FindTagsPaginationResult implements IQueryResult {
  public readonly rows: {
    id: string;
    groupId: string;
    name: string;
    slug: string;
    totalUsed: number;
    groups: GroupSharedDto[];
  }[];
  public readonly total: number;
}
