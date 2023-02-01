import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GroupService } from '../../../../../shared/group';
import { GroupSharedDto } from '../../../../../shared/group/dto';
import { FindTagsPaginationQuery } from './find-tags-pagination.query';
import { FindTagsPaginationResult } from './find-tags-pagination.result';

@QueryHandler(FindTagsPaginationQuery)
export class FindTagsPaginationHandler
  implements IQueryHandler<FindTagsPaginationQuery, FindTagsPaginationResult>
{
  @Inject() private readonly _groupService: GroupService;

  public async execute(query: FindTagsPaginationQuery): Promise<FindTagsPaginationResult> {
    const { groupIds, name, offset, limit } = query.payload;
    if (!groupIds) {
      return {
        rows: [],
        total: 0,
      };
    }

    // const { rows, total } = await this._tagRepo.getPagination({
    //   name,
    //   groupIds,
    //   offset,
    //   limit,
    // });

    // const rootGroupIds = rows.map((r) => {
    //   return r.get('groupId').value;
    // });
    // const groups = await this._getGroupsInfo(rootGroupIds);
    // const result = {
    //   rows: rows.map((row) => ({
    //     id: row.get('id').value,
    //     name: row.get('name').value,
    //     slug: row.get('slug').value,
    //     groupId: row.get('groupId').value,
    //     totalUsed: row.get('totalUsed').value,
    //     groups: groups[row.get('groupId').value],
    //   })),
    //   total,
    // };
    // return result;
  }

  private async _getGroupsInfo(groupIds: string[]): Promise<Record<string, GroupSharedDto[]>> {
    const groups = {};
    const groupIdMap = {};
    const rootGroupInfos = await this._groupService.getMany(groupIds);
    const childGroupIds = rootGroupInfos.reduce<string[]>((ids, rootGroupInfo) => {
      const childIds = [
        ...rootGroupInfo.child.private,
        ...rootGroupInfo.child.open,
        ...rootGroupInfo.child.closed,
        ...rootGroupInfo.child.secret,
      ];
      groupIdMap[rootGroupInfo.id] = childIds;
      return ids.concat(childIds);
    }, []);

    const childGroupInfos = await this._groupService.getMany(childGroupIds);
    for (const rootGroupInfo of rootGroupInfos) {
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
