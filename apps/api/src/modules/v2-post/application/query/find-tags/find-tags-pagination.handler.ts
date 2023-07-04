import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { ITagQuery, TAG_QUERY_TOKEN } from '../../../domain/query-interface';
import { FindTagsPaginationQuery } from './find-tags-pagination.query';
import { FindTagsPaginationDto } from './find-tags-pagination.dto';

@QueryHandler(FindTagsPaginationQuery)
export class FindTagsPaginationHandler
  implements IQueryHandler<FindTagsPaginationQuery, FindTagsPaginationDto>
{
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN) private readonly _groupAppService: IGroupApplicationService,
    @Inject(TAG_QUERY_TOKEN) private readonly _tagQuery: ITagQuery
  ) {}

  public async execute(query: FindTagsPaginationQuery): Promise<FindTagsPaginationDto> {
    const { groupIds, name, offset, limit } = query.payload;
    if (!groupIds) {
      return {
        rows: [],
        total: 0,
      };
    }
    const { rows, total } = await this._tagQuery.getPagination({
      name,
      groupIds,
      offset,
      limit,
    });

    const rootGroupIds = rows.map((r) => {
      return r.get('groupId');
    });

    const groups = await this._getGroupsInfo(rootGroupIds);
    return new FindTagsPaginationDto({
      rows: rows.map((row) => ({
        id: row.get('id'),
        name: row.get('name'),
        slug: row.get('slug'),
        groupId: row.get('groupId'),
        totalUsed: row.get('totalUsed'),
        groups: groups[row.get('groupId')],
      })),
      total,
    });
  }

  private async _getGroupsInfo(
    groupIds: string[]
  ): Promise<Record<string, Omit<GroupDto, 'child'>[]>> {
    const groups = {};
    const groupIdMap = {};
    const rootGroups = await this._groupAppService.findAllByIds(groupIds);
    const childGroupIds = rootGroups.reduce<string[]>((ids, rootGroupInfo) => {
      const childIds = [
        ...rootGroupInfo.child.private,
        ...rootGroupInfo.child.open,
        ...rootGroupInfo.child.closed,
        ...rootGroupInfo.child.secret,
      ];
      groupIdMap[rootGroupInfo.id] = childIds;
      return ids.concat(childIds);
    }, []);

    const childGroupInfos = await this._groupAppService.findAllByIds(childGroupIds);
    for (const rootGroupInfo of rootGroups) {
      delete rootGroupInfo.child;
      groups[rootGroupInfo.id] = [rootGroupInfo];
      for (const childGroupId of groupIdMap[rootGroupInfo.id]) {
        const thisChildGroupInfo = childGroupInfos.find((e) => e.id === childGroupId);
        delete thisChildGroupInfo.child;
        groups[rootGroupInfo.id].push(thisChildGroupInfo);
      }
    }

    return groups;
  }
}
