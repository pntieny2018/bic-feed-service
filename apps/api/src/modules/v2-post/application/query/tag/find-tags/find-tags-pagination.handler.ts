import { GroupDto } from '@libs/service/group';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../../domain/repositoty-interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../../domain/service-adapter-interface';
import { FindTagsPaginationDto } from '../../../dto';

import { FindTagsPaginationQuery } from './find-tags-pagination.query';

@QueryHandler(FindTagsPaginationQuery)
export class FindTagsPaginationHandler
  implements IQueryHandler<FindTagsPaginationQuery, FindTagsPaginationDto>
{
  public constructor(
    @Inject(GROUP_ADAPTER) private readonly _groupAdapter: IGroupAdapter,
    @Inject(TAG_REPOSITORY_TOKEN) private readonly _tagRepository: ITagRepository
  ) {}

  public async execute(query: FindTagsPaginationQuery): Promise<FindTagsPaginationDto> {
    const { groupIds, name, offset, limit } = query.payload;
    if (!groupIds) {
      return {
        rows: [],
        total: 0,
      };
    }
    const { rows, total } = await this._tagRepository.getPagination({
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
    const rootGroups = await this._groupAdapter.getGroupsByIds(groupIds);
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

    const childGroupInfos = await this._groupAdapter.getGroupsByIds(childGroupIds);
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
