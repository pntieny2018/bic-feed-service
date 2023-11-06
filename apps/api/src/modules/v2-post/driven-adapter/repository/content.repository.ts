import { CONTENT_STATUS, ORDER } from '@beincom/constants';
import { CONTENT_TARGET } from '@beincom/constants/lib/content';
import {
  CursorPaginationResult,
  getDatabaseConfig,
  PaginationProps,
} from '@libs/database/postgres/common';
import {
  PostGroupModel,
  PostModel,
  ReportContentDetailAttributes,
} from '@libs/database/postgres/model';
import {
  LibPostCategoryRepository,
  LibPostGroupRepository,
  LibPostSeriesRepository,
  LibUserMarkReadPostRepository,
  LibUserReportContentRepository,
  LibUserSeenPostRepository,
  LibContentRepository,
  LibPostTagRepository,
  LibUserSavePostRepository,
} from '@libs/database/postgres/repository';
import {
  FindContentIncludeOptions,
  FindContentProps,
  GetPaginationContentsProps,
} from '@libs/database/postgres/repository/interface';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Op, Sequelize, Transaction, WhereOptions } from 'sequelize';

import { ContentNotFoundException } from '../../domain/exception';
import {
  PostEntity,
  ArticleEntity,
  ContentEntity,
  SeriesEntity,
  PostAttributes,
  SeriesAttributes,
  ArticleAttributes,
  ContentAttributes,
} from '../../domain/model/content';
import {
  GetCursorPaginationPostIdsInGroup,
  GetReportContentIdsProps,
  IContentRepository,
} from '../../domain/repositoty-interface';
import { ContentMapper } from '../mapper/content.mapper';

@Injectable()
export class ContentRepository implements IContentRepository {
  public constructor(
    @InjectConnection()
    private readonly _sequelizeConnection: Sequelize,
    private readonly _libContentRepo: LibContentRepository,
    private readonly _libPostTagRepo: LibPostTagRepository,
    private readonly _libPostSeriesRepo: LibPostSeriesRepository,
    private readonly _libPostGroupRepo: LibPostGroupRepository,
    private readonly _libPostCategoryRepo: LibPostCategoryRepository,
    private readonly _libUserSeenPostRepo: LibUserSeenPostRepository,
    private readonly _libUserMarkReadPostRepo: LibUserMarkReadPostRepository,
    private readonly _libUserReportContentRepo: LibUserReportContentRepository,
    private readonly _libUserSavePostRepo: LibUserSavePostRepository,
    private readonly _contentMapper: ContentMapper
  ) {}

  public async create(contentEntity: PostEntity | ArticleEntity | SeriesEntity): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const model = this._contentMapper.toPersistence(contentEntity);
      await this._libContentRepo.create(model, {
        transaction,
      });

      if (contentEntity instanceof PostEntity || contentEntity instanceof ArticleEntity) {
        await this._setSeries(contentEntity, transaction);
        await this._setTags(contentEntity, transaction);
      }
      await this._setGroups(contentEntity, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public async update(contentEntity: ContentEntity): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const model = this._contentMapper.toPersistence(
        contentEntity as ContentEntity<
          (PostAttributes | SeriesAttributes | ArticleAttributes) & ContentAttributes
        >
      );
      await this._libContentRepo.update(model, {
        where: {
          id: model.id,
        },
        transaction,
      });

      if (contentEntity instanceof PostEntity || contentEntity instanceof ArticleEntity) {
        await this._setSeries(contentEntity, transaction);
        await this._setTags(contentEntity, transaction);

        if (contentEntity instanceof ArticleEntity) {
          await this._setCategories(contentEntity, transaction);
        }
      }

      await this._setGroups(contentEntity, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async _setGroups(postEntity: ContentEntity, transaction: Transaction): Promise<void> {
    const state = postEntity.getState();
    if (state.attachGroupIds?.length > 0) {
      await this._libPostGroupRepo.bulkCreate(
        state.attachGroupIds.map((groupId) => ({
          postId: postEntity.getId(),
          groupId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachGroupIds?.length > 0) {
      await this._libPostGroupRepo.delete({
        where: {
          postId: postEntity.getId(),
          groupId: state.detachGroupIds,
        },
        transaction,
      });
    }
  }

  private async _setSeries(
    contentEntity: PostEntity | ArticleEntity,
    transaction: Transaction
  ): Promise<void> {
    const state = contentEntity.getState();
    if (state.detachSeriesIds.length > 0) {
      await this._libPostSeriesRepo.delete({
        where: {
          postId: contentEntity.getId(),
          seriesId: state.detachSeriesIds,
        },
        transaction,
      });
    }

    if (state.attachSeriesIds.length > 0) {
      const dataInsert = await Promise.all(
        state.attachSeriesIds.map(async (seriesId) => ({
          postId: contentEntity.getId(),
          seriesId,
          zindex:
            (await this._libPostSeriesRepo.max('zindex', {
              where: {
                seriesId,
              },
            })) || 0 + 1,
        }))
      );

      await this._libPostSeriesRepo.bulkCreate(dataInsert, {
        transaction,
        ignoreDuplicates: true,
      });
    }
  }

  private async _setTags(
    contentEntity: PostEntity | ArticleEntity,
    transaction: Transaction
  ): Promise<void> {
    const state = contentEntity.getState();
    if (state.attachTagIds.length > 0) {
      await this._libPostTagRepo.bulkCreate(
        state.attachTagIds.map((tagId) => ({
          postId: contentEntity.getId(),
          tagId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachTagIds.length > 0) {
      await this._libPostTagRepo.delete({
        where: {
          postId: contentEntity.getId(),
          tagId: state.detachTagIds,
        },
        transaction,
      });
    }
  }

  private async _setCategories(
    contentEntity: ArticleEntity,
    transaction: Transaction
  ): Promise<void> {
    const state = contentEntity.getState();
    if (state.attachCategoryIds.length > 0) {
      await this._libPostCategoryRepo.bulkCreate(
        state.attachCategoryIds.map((categoryId) => ({
          postId: contentEntity.getId(),
          categoryId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachCategoryIds.length > 0) {
      await this._libPostCategoryRepo.delete({
        where: {
          postId: contentEntity.getId(),
          categoryId: state.detachCategoryIds,
        },
        transaction,
      });
    }
  }

  public async delete(id: string): Promise<void> {
    await this._libContentRepo.delete({
      where: { id },
      force: true,
    });
    return;
  }

  public async findContentById(
    contentId: string,
    options?: FindContentIncludeOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    const content = await this._libContentRepo.findOne({
      where: { id: contentId },
      include: options,
    });
    return this._contentMapper.toDomain(content);
  }

  public async findContentByIdInActiveGroup(
    contentId: string,
    options?: FindContentIncludeOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    const content = await this._libContentRepo.findOne({
      where: { id: contentId, groupArchived: false },
      include: options,
    });
    return this._contentMapper.toDomain(content);
  }

  public async findContentByIdInArchivedGroup(
    contentId: string,
    options?: FindContentIncludeOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    const content = await this._libContentRepo.findOne({
      where: { id: contentId, groupArchived: true },
      include: options,
    });
    return this._contentMapper.toDomain(content);
  }

  public async findContentByIdExcludeReportedByUserId(
    contentId: string,
    userId: string,
    options?: FindContentIncludeOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    const content = await this._libContentRepo.findOne({
      where: { id: contentId, groupArchived: false, excludeReportedByUserId: userId },
      include: options,
    });
    return this._contentMapper.toDomain(content);
  }

  public async findOne(
    findOnePostOptions: FindContentProps
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    const content = await this._libContentRepo.findOne(findOnePostOptions);

    return this._contentMapper.toDomain(content);
  }

  public async getContentById(
    contentId: string
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    const content = await this.findContentById(contentId);
    if (!content) {
      throw new ContentNotFoundException();
    }

    return content;
  }

  public async findAll(
    findAllPostOptions: FindContentProps,
    offsetPaginate?: PaginationProps
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]> {
    const contents = await this._libContentRepo.findAll(findAllPostOptions, offsetPaginate);
    return contents.map((content) => this._contentMapper.toDomain(content));
  }

  public async markSeen(postId: string, userId: string): Promise<void> {
    await this._libUserSeenPostRepo.bulkCreate(
      [
        {
          postId: postId,
          userId: userId,
        },
      ],
      { ignoreDuplicates: true }
    );
  }

  public async hasSeen(postId: string, userId: string): Promise<boolean> {
    const content = await this._libUserSeenPostRepo.first({
      where: {
        postId: postId,
        userId: userId,
      },
    });
    return Boolean(content);
  }

  public async markReadImportant(postId: string, userId: string): Promise<void> {
    await this._libUserMarkReadPostRepo.bulkCreate(
      [
        {
          postId,
          userId,
        },
      ],
      { ignoreDuplicates: true }
    );
  }

  public async getPagination(
    getPaginationContentsProps: GetPaginationContentsProps
  ): Promise<CursorPaginationResult<ArticleEntity | PostEntity | SeriesEntity>> {
    const { rows, meta } = await this._libContentRepo.getPagination(getPaginationContentsProps);

    return {
      rows: rows.map((row) => this._contentMapper.toDomain(row)),
      meta,
    };
  }

  public async getReportedContentIdsByUser(props: GetReportContentIdsProps): Promise<string[]> {
    if (!props.reportUser) {
      return [];
    }
    const condition: WhereOptions<ReportContentDetailAttributes> = {
      [Op.and]: [
        {
          createdBy: props.reportUser,
          ...(props.target && props.target.length && { targetType: props.target }),
          ...(props.groupIds && props.groupIds.length && { groupId: props.groupIds }),
        },
      ],
    };

    const rows = await this._libUserReportContentRepo.findMany({
      where: condition,
    });

    return rows.map((row) => row.targetId);
  }

  public async countDraftContentByUserId(userId: string): Promise<number> {
    return this._libContentRepo.count({
      where: {
        createdBy: userId,
        status: CONTENT_STATUS.DRAFT,
      },
    });
  }

  public async findPinnedContentIdsByGroupId(groupId: string): Promise<string[]> {
    const postGroups = await this._libPostGroupRepo.findMany({
      where: {
        groupId,
        isPinned: true,
      },
      order: [['pinned_index', ORDER.ASC]],
      include: [
        {
          model: PostModel,
          as: 'post',
          required: true,
          select: [],
          where: {
            status: CONTENT_STATUS.PUBLISHED,
            isHidden: false,
          },
        },
      ],
    });

    return postGroups.map((postGroup) => postGroup.postId);
  }

  public async reorderPinnedContent(contentIds: string[], groupId: string): Promise<void> {
    const reorderExecute = contentIds.map((postId, index) => {
      return this._libPostGroupRepo.update(
        {
          pinnedIndex: index + 1,
        },
        {
          where: {
            groupId,
            postId,
          },
        }
      );
    });

    await Promise.all(reorderExecute);
  }

  public async pinContent(contentId: string, groupIds: string[]): Promise<void> {
    if (groupIds.length > 0) {
      await Promise.all(
        groupIds.map(async (groupId) => {
          return this._libPostGroupRepo.update(
            {
              isPinned: true,
              pinnedIndex:
                (await this._libPostGroupRepo.max('pinnedIndex', {
                  where: {
                    groupId,
                  },
                })) + 1,
            },
            {
              where: {
                postId: contentId,
                groupId,
              },
            }
          );
        })
      );
    }
  }

  public async unpinContent(contentId: string, groupIds: string[]): Promise<void> {
    if (groupIds.length === 0) {
      return;
    }

    await this._libPostGroupRepo.update(
      {
        isPinned: false,
        pinnedIndex: 0,
      },
      {
        where: {
          postId: contentId,
          groupId: groupIds,
        },
      }
    );
  }

  public async saveContent(userId: string, contentId: string): Promise<void> {
    await this._libUserSavePostRepo.bulkCreate(
      [
        {
          userId,
          postId: contentId,
        },
      ],
      {
        ignoreDuplicates: true,
      }
    );
  }

  public async findUserIdsReportedTargetId(
    targetId: string,
    contentTarget?: CONTENT_TARGET
  ): Promise<string[]> {
    const condition: WhereOptions<ReportContentDetailAttributes> = {
      [Op.and]: [
        {
          targetId,
          ...(contentTarget && { targetType: contentTarget }),
        },
      ],
    };

    const reports = await this._libUserReportContentRepo.findMany({
      where: condition,
    });

    return (reports || []).map((report) => report.createdBy);
  }

  public async createPostSeries(seriesId: string, postId: string): Promise<void> {
    const maxIndex =
      (await this._libPostSeriesRepo.max('zindex', {
        where: {
          seriesId,
        },
      })) || 0;

    await this._libPostSeriesRepo.bulkCreate(
      [
        {
          seriesId,
          postId,
          zindex: maxIndex + 1,
        },
      ],
      {
        ignoreDuplicates: true,
      }
    );
  }

  public async deletePostSeries(seriesId: string, postId: string): Promise<void> {
    await this._libPostSeriesRepo.delete({
      where: {
        seriesId,
        postId,
      },
    });
  }

  public async reorderPostsSeries(seriesId: string, itemIds: string[]): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      let zindex = 0;
      for (const itemId of itemIds) {
        await this._libPostSeriesRepo.update(
          {
            zindex,
          },
          {
            where: {
              postId: itemId,
              seriesId,
            },
          }
        );
        zindex++;
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  public async getCursorPaginationPostIdsPublishedInGroup(
    props: GetCursorPaginationPostIdsInGroup
  ): Promise<{
    ids: string[];
    cursor: string;
  }> {
    const { groupIds, notInGroupIds, limit, after } = props;
    const { schema } = getDatabaseConfig();
    const postGroupTable = PostGroupModel.tableName;

    const rows = await this._libContentRepo.cursorPaginate(
      {
        select: ['id'],
        where: {
          status: CONTENT_STATUS.PUBLISHED,
          isHidden: false,
        },
        whereRaw: `EXISTS (          
                            SELECT 1
                            FROM  ${schema}.${postGroupTable} g            
                            WHERE g.post_id = "PostModel".id  AND g.group_id IN (:groupIds)
                            AND is_archived = false
                  ) ${
                    notInGroupIds.length > 0 ? ` AND "PostModel".id NOT IN (:notInGroupIds)` : ``
                  }`,
        replacements: {
          groupIds,
        },
      },
      {
        after,
        limit,
        column: 'created_at',
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
