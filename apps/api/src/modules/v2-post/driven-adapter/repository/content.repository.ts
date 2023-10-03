import { CONTENT_STATUS, CONTENT_TARGET } from '@beincom/constants';
import { CursorPaginationResult, PaginationProps } from '@libs/database/postgres/common';
import {
  PostModel,
  PostGroupModel,
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
} from '@libs/database/postgres/repository';
import {
  FindContentIncludeOptions,
  FindContentProps,
  GetPaginationContentsProps,
} from '@libs/database/postgres/repository/interface';
import { LibPostTagRepository } from '@libs/database/postgres/repository/post-tag.repository';
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
import { IContentRepository } from '../../domain/repositoty-interface';
import { ContentMapper } from '../mapper/content.mapper';

export class ContentRepository implements IContentRepository {
  public constructor(
    @InjectConnection()
    private readonly _sequelizeConnection: Sequelize,
    private readonly _libContentRepository: LibContentRepository,
    private readonly _libPostTagRepository: LibPostTagRepository,
    private readonly _libPostSeriesRepository: LibPostSeriesRepository,
    private readonly _libPostGroupRepository: LibPostGroupRepository,
    private readonly _libPostCategoryRepository: LibPostCategoryRepository,
    private readonly _libUserSeenPostRepository: LibUserSeenPostRepository,
    private readonly _libUserMarkReadPostRepository: LibUserMarkReadPostRepository,
    private readonly _libUserReportContentRepository: LibUserReportContentRepository,
    private readonly _contentMapper: ContentMapper
  ) {}

  public async create(contentEntity: PostEntity | ArticleEntity | SeriesEntity): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const model = this._contentMapper.toPersistence(contentEntity);
      await this._libContentRepository.create(model, {
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
      await this._libContentRepository.update(model, {
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
      await this._libPostGroupRepository.bulkCreate(
        state.attachGroupIds.map((groupId) => ({
          postId: postEntity.getId(),
          groupId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachGroupIds?.length > 0) {
      await this._libPostGroupRepository.delete({
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
    if (state.attachSeriesIds.length > 0) {
      await this._libPostSeriesRepository.bulkCreate(
        state.attachSeriesIds.map((seriesId) => ({
          postId: contentEntity.getId(),
          seriesId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachSeriesIds.length > 0) {
      await this._libPostSeriesRepository.delete({
        where: {
          postId: contentEntity.getId(),
          seriesId: state.detachSeriesIds,
        },
        transaction,
      });
    }
  }

  private async _setTags(
    contentEntity: PostEntity | ArticleEntity,
    transaction: Transaction
  ): Promise<void> {
    const state = contentEntity.getState();
    if (state.attachTagIds.length > 0) {
      await this._libPostTagRepository.bulkCreate(
        state.attachTagIds.map((tagId) => ({
          postId: contentEntity.getId(),
          tagId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachTagIds.length > 0) {
      await this._libPostTagRepository.delete({
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
      await this._libPostCategoryRepository.bulkCreate(
        state.attachCategoryIds.map((categoryId) => ({
          postId: contentEntity.getId(),
          categoryId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachCategoryIds.length > 0) {
      await this._libPostCategoryRepository.delete({
        where: {
          postId: contentEntity.getId(),
          categoryId: state.detachCategoryIds,
        },
        transaction,
      });
    }
  }

  public async delete(id: string): Promise<void> {
    await this._libContentRepository.delete({
      where: { id },
    });
    return;
  }

  public async findContentById(
    contentId: string,
    options?: FindContentIncludeOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    const content = await this._libContentRepository.findOne({
      where: { id: contentId },
      include: options,
    });
    return this._contentMapper.toDomain(content);
  }

  public async findContentByIdInActiveGroup(
    contentId: string,
    options?: FindContentIncludeOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    const content = await this._libContentRepository.findOne({
      where: { id: contentId, groupArchived: false },
      include: options,
    });
    return this._contentMapper.toDomain(content);
  }

  public async findContentByIdInArchivedGroup(
    contentId: string,
    options?: FindContentIncludeOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    const content = await this._libContentRepository.findOne({
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
    const content = await this._libContentRepository.findOne({
      where: { id: contentId, groupArchived: false, excludeReportedByUserId: userId },
      include: options,
    });
    return this._contentMapper.toDomain(content);
  }

  public async findOne(
    findOnePostOptions: FindContentProps
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    const content = await this._libContentRepository.findOne(findOnePostOptions);
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
    const contents = await this._libContentRepository.findAll(findAllPostOptions, offsetPaginate);
    return contents.map((content) => this._contentMapper.toDomain(content));
  }

  public async markSeen(postId: string, userId: string): Promise<void> {
    await this._libUserSeenPostRepository.bulkCreate(
      [
        {
          postId: postId,
          userId: userId,
        },
      ],
      { ignoreDuplicates: true }
    );
  }

  public async markReadImportant(postId: string, userId: string): Promise<void> {
    await this._libUserMarkReadPostRepository.bulkCreate(
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
    const { rows, meta } = await this._libContentRepository.getPagination(
      getPaginationContentsProps
    );

    return {
      rows: rows.map((row) => this._contentMapper.toDomain(row)),
      meta,
    };
  }

  public async getReportedContentIdsByUser(
    createdBy: string,
    target?: CONTENT_TARGET[]
  ): Promise<string[]> {
    if (!createdBy) {
      return [];
    }
    const condition: WhereOptions<ReportContentDetailAttributes> = {
      [Op.and]: [
        {
          createdBy,
          ...(target ? { targetType: target } : {}),
        },
      ],
    };

    const rows = await this._libUserReportContentRepository.findMany({
      where: condition,
    });

    return rows.map((row) => row.targetId);
  }

  public countContentDraft(userId: string): Promise<number> {
    return this._libContentRepository.count({
      where: {
        createdBy: userId,
        status: CONTENT_STATUS.DRAFT,
      },
    });
  }

  public async findPinnedPostGroupsByGroupId(groupId: string): Promise<PostGroupModel[]> {
    const postGroupModel = await this._libPostGroupRepository.getModel();
    return postGroupModel.findAll({
      where: {
        groupId,
        isPinned: true,
      },
      include: [
        {
          model: PostModel,
          as: 'post',
          required: true,
          attributes: [],
          where: {
            status: CONTENT_STATUS.PUBLISHED,
            isHidden: false,
          },
        },
      ],
    });
  }

  public async reorderPinnedContent(contentIds: string[], groupId: string): Promise<void> {
    const postGroupModel = await this._libPostGroupRepository.getModel();

    const reorderExecute = contentIds.map((postId, index) => {
      return postGroupModel.update(
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
}
