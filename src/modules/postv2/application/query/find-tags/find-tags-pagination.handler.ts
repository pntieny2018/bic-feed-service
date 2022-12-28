import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GroupService } from '../../../../../shared/group';
import {
  ITagRepository,
  TAG_REPOSITORY,
} from '../../../domain/repositoty-interface/tag.repository.interface';
import { FindTagsPaginationQuery } from './find-tags-pagination.query';
import { FindTagsPaginationResult } from './find-tags-pagination.result';

@QueryHandler(FindTagsPaginationQuery)
export class FindTagsPaginationHandler
  implements IQueryHandler<FindTagsPaginationQuery, FindTagsPaginationResult>
{
  @Inject(TAG_REPOSITORY) private readonly _tagRepo: ITagRepository;
  @Inject() private readonly _groupService: GroupService;

  public async execute(query: FindTagsPaginationQuery): Promise<FindTagsPaginationResult> {
    const { groupIds, name, offset, limit } = query;
    const { rows, total } = await this._tagRepo.getPagination({
      name,
      groupIds,
      offset,
      limit,
    });

    const rootGroupIds = rows.map((r) => {
      return r.groupId;
    });

    const groups = {};
    const groupIdMap = {};
    const rootGroupInfos = await this._groupService.getMany(rootGroupIds);
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

    return {
      rows: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        groupId: row.id,
        totalUsed: row.totalUsed,
        groups: groups[row.groupId],
      })),
      total,
    };
  }
}
