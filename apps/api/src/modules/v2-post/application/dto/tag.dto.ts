import { IQueryResult } from '@nestjs/cqrs';

import { GroupDto } from '../../../v2-group/application';

export class TagDto {
  public id: string;
  public groupId: string;
  public name: string;
  public slug?: string;
  public totalUsed?: number;

  public constructor(data: Partial<TagDto>) {
    Object.assign(this, data);
  }
}

export class FindTagsPaginationDto implements IQueryResult {
  public readonly rows: {
    id: string;
    groupId: string;
    name: string;
    slug: string;
    totalUsed: number;
    groups: Omit<GroupDto, 'child'>[];
  }[];
  public readonly total: number;

  public constructor(data: Partial<FindTagsPaginationDto>) {
    Object.assign(this, data);
  }
}

export class SearchTagsDto {
  public list?: string[];

  public constructor(list: string[]) {
    this.list = list;
  }
}
