import { CONTENT_STATUS, ORDER } from '@beincom/constants';
import { CursorPaginationResult } from '@libs/database/postgres/common';
import { getDatabaseConfig } from '@libs/database/postgres/config';
import { PostAttributes, PostGroupModel } from '@libs/database/postgres/model';
import { LibContentRepository, LibPostGroupRepository } from '@libs/database/postgres/repository';
import {
  FindContentIncludeOptions,
  GetPaginationContentsProps,
} from '@libs/database/postgres/repository/interface';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

import {
  GetCursorPaginationPostIdsInGroup,
  IContentRepository,
} from '../../domain/repositoty-interface';

@Injectable()
export class ContentRepository implements IContentRepository {
  public constructor(
    @InjectConnection()
    private readonly _sequelizeConnection: Sequelize,
    private readonly _libContentRepo: LibContentRepository,
    private readonly _libPostGroupRepo: LibPostGroupRepository
  ) {}

  public async findContentByIdInActiveGroup(
    contentId: string,
    options?: FindContentIncludeOptions
  ): Promise<PostAttributes> {
    return this._libContentRepo.findOne({
      where: { id: contentId, groupArchived: false },
      include: options,
    });
  }

  public async getCursorPagination(
    getPaginationContentsProps: GetPaginationContentsProps
  ): Promise<CursorPaginationResult<PostAttributes>> {
    return this._libContentRepo.getPagination(getPaginationContentsProps);
  }

  public async getCursorPaginationPostIdsPublishedInGroup(
    props: GetCursorPaginationPostIdsInGroup
  ): Promise<{
    ids: string[];
    cursor: string;
  }> {
    const { groupIds, limit, after } = props;
    const { schema } = getDatabaseConfig();
    const postGroupTable = PostGroupModel.tableName;

    const rows = await this._libContentRepo.cursorPaginate(
      {
        select: ['id', 'createdAt'],
        where: {
          status: CONTENT_STATUS.PUBLISHED,
          isHidden: false,
        },
        whereRaw: `EXISTS (          
                            SELECT 1
                            FROM  ${schema}.${postGroupTable} g            
                            WHERE g.post_id = "PostModel".id  AND g.group_id IN (${groupIds
                              .map((item) => this._sequelizeConnection.escape(item))
                              .join(',')})
                            AND is_archived = false
                  )`,
      },
      {
        after,
        limit,
        sortColumns: ['createdAt'],
        order: ORDER.DESC,
      }
    );
    return {
      ids: rows.rows.map((row) => row.id),
      cursor: rows.meta.endCursor,
    };
  }

  public async hasBelongActiveGroupIds(contentId: string, groupIds: string[]): Promise<boolean> {
    const data = await this._libPostGroupRepo.first({
      where: {
        groupId: groupIds,
        postId: contentId,
        isArchived: false,
      },
    });

    return !!data;
  }
}
