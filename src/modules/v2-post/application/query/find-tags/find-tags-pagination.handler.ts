import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GroupDto,
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { GroupId } from '../../../../v2-group/domain/model/group';
import { ITagQuery, TAG_QUERY_TOKEN } from '../../../domain/query-interface';
import { FindTagsPaginationQuery } from './find-tags-pagination.query';
import { FindTagsPaginationResult } from './find-tags-pagination.result';

@QueryHandler(FindTagsPaginationQuery)
export class FindTagsPaginationHandler
  implements IQueryHandler<FindTagsPaginationQuery, FindTagsPaginationResult>
{
  @Inject(GROUP_APPLICATION_TOKEN) private readonly _groupAppService: IGroupApplicationService;
  @Inject(TAG_QUERY_TOKEN) private readonly _tagQuery: ITagQuery;

  public async execute(query: FindTagsPaginationQuery): Promise<FindTagsPaginationResult> {
    const { groupIds, name, offset, limit } = query.payload;
    if (!groupIds) {
      return {
        rows: [],
        total: 0,
      };
    }
    const { rows, total } = await this._tagQuery.getPagination({
      name,
      groupIds: groupIds.map((groupId) => GroupId.fromString(groupId)),
      offset,
      limit,
    });

    const rootGroupIds = rows.map((r) => {
      return r.get('groupId').value;
    });

    const groups = await this._getGroupsInfo(rootGroupIds);
    const result = {
      rows: rows.map((row) => ({
        id: row.get('id').value,
        name: row.get('name').value,
        slug: row.get('slug').value,
        groupId: row.get('groupId').value,
        totalUsed: row.get('totalUsed').value,
        groups: groups[row.get('groupId').value],
      })),
      total,
    };
    return result;
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
