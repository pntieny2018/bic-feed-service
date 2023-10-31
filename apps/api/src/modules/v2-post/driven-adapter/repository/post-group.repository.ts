import { ORDER } from '@beincom/constants';
import { CursorPaginationResult } from '@libs/database/postgres/common';
import { PostGroupAttributes } from '@libs/database/postgres/model';
import { LibPostGroupRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';
import { isBoolean } from 'lodash';

import {
  GetPaginationPostGroupProps,
  IPostGroupRepository,
} from '../../domain/repositoty-interface';

@Injectable()
export class PostGroupRepository implements IPostGroupRepository {
  public constructor(private readonly _libPostGroupRepo: LibPostGroupRepository) {}

  public async getNotInStateGroupIds(groupIds: string[], isArchived: boolean): Promise<string[]> {
    const record = await this._libPostGroupRepo.findMany({
      selectRaw: [
        ['DISTINCT group_id', 'groupId'],
        ['is_archived', 'isArchived'],
      ],
      where: {
        groupId: groupIds,
        isArchived: !isArchived,
      },
    });

    return record.map((item) => item.groupId);
  }

  public async getPagination(
    input: GetPaginationPostGroupProps
  ): Promise<CursorPaginationResult<PostGroupAttributes>> {
    const { where, limit = 1000, before, after, order = ORDER.DESC, column = 'createdAt' } = input;
    const { groupIds, isArchived } = where;

    const { rows, meta } = await this._libPostGroupRepo.cursorPaginate(
      {
        where: {
          groupId: groupIds,
          ...(isBoolean(isArchived) && { isArchived }),
        },
      },
      { limit, before, after, order, column }
    );

    return { rows, meta };
  }

  public async updateGroupState(groupIds: string[], isArchived: boolean): Promise<void> {
    if (!groupIds.length) {
      return;
    }

    await this._libPostGroupRepo.update({ isArchived }, { where: { groupId: groupIds } });
  }
}
