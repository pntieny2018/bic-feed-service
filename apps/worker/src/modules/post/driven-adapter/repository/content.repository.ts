import { CONTENT_STATUS, ORDER } from '@beincom/constants';
import { CursorPaginationResult } from '@libs/database/postgres/common';
import { PostAttributes, PostGroupModel } from '@libs/database/postgres/model';
import { LibContentRepository } from '@libs/database/postgres/repository';
import {
  FindContentIncludeOptions,
  GetPaginationContentsProps,
} from '@libs/database/postgres/repository/interface';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Op, Sequelize } from 'sequelize';

import {
  CountNumerOfPostsInGroup,
  GetPaginationPostIdsInGroup,
  IContentRepository,
} from '../../domain/repositoty-interface';

@Injectable()
export class ContentRepository implements IContentRepository {
  public constructor(
    @InjectConnection()
    private readonly _sequelizeConnection: Sequelize,
    private readonly _libContentRepo: LibContentRepository
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

  public async getPaginationPostIdsPublishedInGroup(
    props: GetPaginationPostIdsInGroup
  ): Promise<PostAttributes[]> {
    const { groupIds, notInGroupIds, limit, offset } = props;
    const postGroupTable = PostGroupModel.getTableName();

    let whereRaw = `EXISTS (          
                            SELECT 1
                            FROM ${postGroupTable} AS "PostsGroups1"            
                            WHERE "PostsGroups1"."post_id" = "PostModel"."id" 
                            AND "PostsGroups1"."group_id" IN (${groupIds
                              .map((item) => this._sequelizeConnection.escape(item))
                              .join(',')})
                    )`;
    if (notInGroupIds && notInGroupIds.length) {
      whereRaw += ` AND NOT EXISTS (
                            SELECT 1
                            FROM ${postGroupTable} AS "PostsGroups2"            
                            WHERE "PostsGroups2"."post_id" = "PostModel"."id" 
                            AND "PostsGroups2"."group_id" IN (${notInGroupIds
                              .map((item) => this._sequelizeConnection.escape(item))
                              .join(',')})
                    )`;
    }

    return this._libContentRepo.findMany({
      select: ['id', 'type', 'publishedAt', 'isImportant', 'createdAt', 'createdBy'],
      where: {
        status: CONTENT_STATUS.PUBLISHED,
        isHidden: false,
      },
      whereRaw,
      limit,
      offset,
      order: [['createdAt', ORDER.DESC]],
    });
  }

  public async countNumberOfPostsPublishedInGroup(
    props: CountNumerOfPostsInGroup
  ): Promise<number> {
    const { groupIds, notInGroupIds } = props;
    const postGroupTable = PostGroupModel.getTableName();

    let whereRaw = `EXISTS (          
                            SELECT 1
                            FROM ${postGroupTable} AS "PostsGroups1"            
                            WHERE "PostsGroups1"."post_id" = "PostModel"."id" 
                            AND "PostsGroups1"."group_id" IN (${groupIds
                              .map((item) => this._sequelizeConnection.escape(item))
                              .join(',')})
                    )`;
    if (notInGroupIds && notInGroupIds.length) {
      whereRaw += ` AND NOT EXISTS (
                            SELECT 1
                            FROM ${postGroupTable} AS "PostsGroups2"            
                            WHERE "PostsGroups2"."post_id" = "PostModel"."id" 
                            AND "PostsGroups2"."group_id" IN (${notInGroupIds
                              .map((item) => this._sequelizeConnection.escape(item))
                              .join(',')})
                    )`;
    }

    return this._libContentRepo.count({
      select: ['id'],
      where: {
        status: CONTENT_STATUS.PUBLISHED,
        isHidden: false,
        [Op.and]: Sequelize.literal(whereRaw),
      },
    });
  }
}
