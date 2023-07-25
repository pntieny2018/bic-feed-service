import { Inject } from '@nestjs/common';
import { Literal } from 'sequelize/types/utils';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { PAGING_DEFAULT_LIMIT } from '../../../../common/constants';
import { FindOptions, Includeable, Op, Sequelize, WhereOptions } from 'sequelize';
import {
  FindContentOptions,
  GetPaginationContentsProps,
  IContentRepository,
  OrderOptions,
} from '../../domain/repositoty-interface';
import { PostEntity } from '../../domain/model/content';
import { IPost, PostModel, PostType } from '../../../../database/models/post.model';
import { PostGroupModel } from '../../../../database/models/post-group.model';
import { SeriesEntity } from '../../domain/model/content/series.entity';
import { ArticleEntity } from '../../domain/model/content/article.entity';
import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';
import { CategoryEntity } from '../../domain/model/category';
import {
  ARTICLE_FACTORY_TOKEN,
  IArticleFactory,
  IPostFactory,
  ISeriesFactory,
  POST_FACTORY_TOKEN,
  SERIES_FACTORY_TOKEN,
} from '../../domain/factory/interface';
import { PostSeriesModel } from '../../../../database/models/post-series.model';
import { PostTagModel } from '../../../../database/models/post-tag.model';
import { ContentEntity } from '../../domain/model/content/content.entity';
import { LinkPreviewModel } from '../../../../database/models/link-preview.model';
import { LinkPreviewEntity } from '../../domain/model/link-preview';
import { TagEntity } from '../../domain/model/tag';
import { UserSeenPostModel } from '../../../../database/models/user-seen-post.model';
import { UserMarkReadPostModel } from '../../../../database/models/user-mark-read-post.model';
import { PostReactionModel } from '../../../../database/models/post-reaction.model';
import { CategoryModel } from '../../../../database/models/category.model';
import { isBoolean } from 'lodash';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { CursorPaginator, OrderEnum } from '../../../../common/dto';
import { PostCategoryModel } from '../../../../database/models/post-category.model';

export class ContentRepository implements IContentRepository {
  public constructor(
    @InjectConnection()
    private readonly _sequelizeConnection: Sequelize,
    @Inject(POST_FACTORY_TOKEN)
    private readonly _postFactory: IPostFactory,
    @Inject(ARTICLE_FACTORY_TOKEN)
    private readonly _articleFactory: IArticleFactory,
    @Inject(SERIES_FACTORY_TOKEN)
    private readonly _seriesFactory: ISeriesFactory,
    @InjectModel(PostModel)
    private readonly _postModel: typeof PostModel,
    @InjectModel(PostGroupModel)
    private readonly _postGroupModel: typeof PostGroupModel,
    @InjectModel(PostSeriesModel)
    private readonly _postSeriesModel: typeof PostSeriesModel,
    @InjectModel(PostTagModel)
    private readonly _postTagModel: typeof PostTagModel,
    @InjectModel(PostCategoryModel)
    private readonly _postCategoryModel: typeof PostCategoryModel,
    @InjectModel(UserSeenPostModel)
    private readonly _userSeenPostModel: typeof UserSeenPostModel,
    @InjectModel(UserMarkReadPostModel)
    private readonly _userReadImportantPostModel: typeof UserMarkReadPostModel
  ) {}

  public async create(contentEntity: PostEntity | ArticleEntity | SeriesEntity): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const model = this._entityToModel(contentEntity);
      await this._postModel.create(model, {
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
      const model = this._entityToModel(contentEntity);
      await this._postModel.update(model, {
        where: {
          id: contentEntity.getId(),
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

  private async _setGroups(postEntity: ContentEntity, transaction): Promise<void> {
    const state = postEntity.getState();
    if (state.attachGroupIds?.length > 0) {
      await this._postGroupModel.bulkCreate(
        state.attachGroupIds.map((groupId) => ({
          postId: postEntity.getId(),
          groupId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachGroupIds?.length > 0) {
      await this._postGroupModel.destroy({
        where: {
          postId: postEntity.getId(),
          groupId: state.detachGroupIds,
        },
        transaction,
      });
    }
  }

  private _entityToModel(postEntity): IPost {
    return {
      id: postEntity.getId(),
      content: postEntity.get('content'),
      title: postEntity.get('title'),
      summary: postEntity.get('summary'),
      privacy: postEntity.get('privacy'),
      isHidden: postEntity.get('isHidden'),
      isReported: postEntity.get('isReported'),
      type: postEntity.get('type'),
      status: postEntity.get('status'),
      errorLog: postEntity.get('errorLog'),
      createdBy: postEntity.get('createdBy'),
      updatedBy: postEntity.get('updatedBy'),
      isImportant: postEntity.get('setting')?.isImportant,
      importantExpiredAt: postEntity.get('setting')?.importantExpiredAt || null,
      canComment: postEntity.get('setting')?.canComment,
      canReact: postEntity.get('setting')?.canReact,
      commentsCount: postEntity.get('aggregation')?.commentsCount || 0,
      totalUsersSeen: postEntity.get('aggregation')?.totalUsersSeen || 0,
      linkPreviewId: postEntity.get('linkPreview')
        ? postEntity.get('linkPreview')?.get('id')
        : null,
      mediaJson: {
        files: (postEntity.get('media')?.files || []).map((file) => file.toObject()),
        images: (postEntity.get('media')?.images || []).map((image) => image.toObject()),
        videos: (postEntity.get('media')?.videos || []).map((video) => video.toObject()),
      },
      mentions: postEntity.get('mentionUserIds') || [],
      coverJson: postEntity.get('cover')?.toObject(),
      videoIdProcessing: postEntity.get('videoIdProcessing'),
      tagsJson: postEntity.get('tags')?.map((tag) => tag.toObject()) || [],
      linkPreview: postEntity.get('linkPreview')?.toObject() || null,
      wordCount: postEntity.get('wordCount'),
      createdAt: postEntity.get('createdAt'),
      publishedAt: postEntity.get('publishedAt'),
      scheduledAt: postEntity.get('scheduledAt'),
    };
  }

  private async _setSeries(contentEntity: PostEntity | ArticleEntity, transaction): Promise<void> {
    const state = contentEntity.getState();
    if (state.attachSeriesIds.length > 0) {
      await this._postSeriesModel.bulkCreate(
        state.attachSeriesIds.map((seriesId) => ({
          postId: contentEntity.getId(),
          seriesId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachSeriesIds.length > 0) {
      await this._postSeriesModel.destroy({
        where: {
          postId: contentEntity.getId(),
          seriesId: state.detachSeriesIds,
        },
        transaction,
      });
    }
  }

  private async _setTags(contentEntity: PostEntity | ArticleEntity, transaction): Promise<void> {
    const state = contentEntity.getState();
    if (state.attachTagIds.length > 0) {
      await this._postTagModel.bulkCreate(
        state.attachTagIds.map((tagId) => ({
          postId: contentEntity.getId(),
          tagId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachTagIds.length > 0) {
      await this._postTagModel.destroy({
        where: {
          postId: contentEntity.getId(),
          tagId: state.detachTagIds,
        },
        transaction,
      });
    }
  }

  private async _setCategories(contentEntity: ArticleEntity, transaction): Promise<void> {
    const state = contentEntity.getState();
    if (state.attachCategoryIds.length > 0) {
      await this._postCategoryModel.bulkCreate(
        state.attachCategoryIds.map((categoryId) => ({
          postId: contentEntity.getId(),
          categoryId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachCategoryIds.length > 0) {
      await this._postCategoryModel.destroy({
        where: {
          postId: contentEntity.getId(),
          categoryId: state.detachCategoryIds,
        },
        transaction,
      });
    }
  }

  public async delete(id: string): Promise<void> {
    await this._postModel.destroy({ where: { id } });
  }

  public async findOne(
    findOnePostOptions: FindContentOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    const findOption = this.buildFindOptions(findOnePostOptions);
    const entity = await this._postModel.findOne(findOption);
    return this._modelToEntity(entity);
  }

  public async findAll(
    findAllPostOptions: FindContentOptions
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]> {
    const findOption = this.buildFindOptions(findAllPostOptions);
    findOption.order = this.buildOrderByOptions(findAllPostOptions.orderOptions);
    const rows = await this._postModel.findAll(findOption);
    return rows.map((row) => this._modelToEntity(row));
  }

  protected buildOrderByOptions(orderOptions: OrderOptions): any {
    if (!orderOptions) return undefined;
    const order = [];
    if (orderOptions.isImportantFirst) {
      order.push([this._sequelizeConnection.literal('"isReadImportant"'), OrderEnum.DESC]);
    }
    if (orderOptions.isPublished) {
      order.push(['publishedAt', OrderEnum.DESC]);
    }
    order.push(['createdAt', OrderEnum.DESC]);
    return order;
  }

  public async markSeen(postId: string, userId: string): Promise<void> {
    await this._userSeenPostModel.bulkCreate(
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
    await this._userReadImportantPostModel.bulkCreate(
      [
        {
          postId,
          userId,
        },
      ],
      { ignoreDuplicates: true }
    );
  }

  private _buildSubSelect(options: FindContentOptions): [Literal, string][] {
    if (!options?.include) return [];

    const subSelect: [Literal, string][] = [];
    const { shouldIncludeSaved, shouldIncludeMarkReadImportant, shouldIncludeImportant } =
      options.include || {};

    if (shouldIncludeSaved) {
      subSelect.push(PostModel.loadSaved(shouldIncludeSaved.userId, 'isSaved'));
    }

    if (shouldIncludeMarkReadImportant) {
      subSelect.push(
        PostModel.loadMarkReadPost(shouldIncludeMarkReadImportant.userId, 'markedReadPost')
      );
    }

    if (shouldIncludeImportant) {
      subSelect.push(PostModel.loadImportant(shouldIncludeImportant.userId, 'isReadImportant'));
    }

    return subSelect;
  }

  private _buildRelationOptions(options: FindContentOptions): Includeable[] {
    if (!options?.include) return [];

    const includeable = [];
    const { groupArchived, groupIds } = options.where || {};
    const {
      shouldIncludeSeries,
      shouldIncludeGroup,
      shouldIncludeLinkPreview,
      shouldIncludeCategory,
      shouldIncludeReaction,
      shouldIncludeItems,
      mustIncludeGroup,
    } = options.include;

    if (shouldIncludeGroup || mustIncludeGroup) {
      includeable.push({
        model: PostGroupModel,
        as: 'groups',
        required: Boolean(mustIncludeGroup),
        where: {
          ...(isBoolean(groupArchived) && {
            isArchived: groupArchived,
          }),
          ...(groupIds && {
            groupId: groupIds,
          }),
        },
      });
    }

    if (shouldIncludeSeries) {
      includeable.push({
        model: PostSeriesModel,
        as: 'postSeries',
        required: false,
        attributes: ['seriesId'],
        where: isBoolean(groupArchived)
          ? PostSeriesModel.filterInGroupArchivedCondition(groupArchived)
          : undefined,
      });
    }

    if (shouldIncludeItems) {
      includeable.push({
        model: PostSeriesModel,
        as: 'itemIds',
        required: false,
        attributes: ['postId', 'zindex'],
      });
    }

    if (shouldIncludeLinkPreview) {
      includeable.push({
        model: LinkPreviewModel,
        as: 'linkPreview',
        required: false,
      });
    }

    if (shouldIncludeReaction?.userId) {
      includeable.push({
        model: PostReactionModel,
        as: 'ownerReactions',
        required: false,
        where: {
          createdBy: shouldIncludeReaction.userId,
        },
      });
    }

    if (shouldIncludeCategory) {
      includeable.push({
        model: CategoryModel,
        as: 'categories',
        required: false,
        through: {
          attributes: [],
        },
        attributes: ['id', 'name'],
      });
    }

    return includeable;
  }

  protected buildFindOptions(options: FindContentOptions): FindOptions<IPost> {
    const findOptions: FindOptions<IPost> = {};
    const subSelect = this._buildSubSelect(options);

    findOptions.where = this._buildWhereOptions(options);
    findOptions.include = this._buildRelationOptions(options);

    const { exclude = [] } = options.attributes || {};
    findOptions.attributes = {
      ...(subSelect.length && {
        include: [...subSelect],
      }),
      ...(exclude.length && {
        exclude,
      }),
    };

    return findOptions;
  }

  private _buildWhereOptions(options: FindContentOptions): WhereOptions<IPost> {
    if (!options?.where) return [];

    const conditions = [];
    let whereOptions: WhereOptions<IPost> | undefined;

    if (options.where.id)
      conditions.push({
        id: options.where.id,
      });

    if (options.where.ids) {
      conditions.push({
        id: options.where.ids,
      });
    }

    if (options.where.type) {
      conditions.push({
        type: options.where.type,
      });
    }

    if (isBoolean(options.where.isImportant)) {
      conditions.push({
        isImportant: options.where.isImportant,
      });
    }

    if (options.where.status) {
      conditions.push({
        status: options.where.status,
      });
    }

    if (options.where.createdBy) {
      conditions.push({
        createdBy: options.where.createdBy,
      });
    }

    if (isBoolean(options.where.isHidden)) {
      conditions.push({
        isHidden: options.where.isHidden,
      });
    }

    if (options.where.scheduledAt) {
      conditions.push({
        scheduledAt: { [Op.lte]: options.where.scheduledAt },
      });
    }

    if (options.where.excludeReportedByUserId) {
      conditions.push(PostModel.excludeReportedByUser(options.where.excludeReportedByUserId));
    }

    if (options.where.savedByUserId) {
      conditions.push(PostModel.filterSavedByUser(options.where.savedByUserId));
    }

    if (options.where.inNewsfeedUserId) {
      conditions.push(PostModel.filterInNewsfeedUser(options.where.inNewsfeedUserId));
    }

    if (
      isBoolean(options.where.groupArchived) &&
      !options.include?.shouldIncludeGroup &&
      !options.include?.mustIncludeGroup
    ) {
      conditions.push(PostModel.filterInGroupArchivedCondition(options.where.groupArchived));
    }

    if (conditions.length) {
      whereOptions = {
        [Op.and]: conditions,
      };
    }

    return whereOptions;
  }

  private _modelToEntity(post: PostModel): PostEntity | ArticleEntity | SeriesEntity {
    if (post === null) return null;
    post = post.toJSON();
    if (post.type === PostType.POST) {
      return this._modelToPostEntity(post);
    } else if (post.type === PostType.SERIES) {
      return this._modelToSeriesEntity(post);
    } else if (post.type === PostType.ARTICLE) {
      return this._modelToArticleEntity(post);
    } else {
      return null;
    }
  }

  private _modelToPostEntity(post: IPost): PostEntity {
    if (post === null) return null;
    return this._postFactory.reconstitute({
      id: post.id,
      isReported: post.isReported,
      isHidden: post.isHidden,
      createdBy: post.createdBy,
      updatedBy: post.updatedBy,
      privacy: post.privacy,
      status: post.status,
      type: post.type,
      lang: post.lang,
      setting: {
        isImportant: post.isImportant,
        importantExpiredAt: post.importantExpiredAt,
        canComment: post.canComment,
        canReact: post.canReact,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      errorLog: post.errorLog,
      publishedAt: post.publishedAt,
      content: post.content,
      mentionUserIds: post.mentions || [],
      groupIds: post.groups?.map((group) => group.groupId),
      seriesIds: post.postSeries?.map((series) => series.seriesId),
      tags: post.tagsJson?.map((tag) => new TagEntity(tag)),
      media: {
        images: post.mediaJson?.images.map((image) => new ImageEntity(image)),
        files: post.mediaJson?.files.map((file) => new FileEntity(file)),
        videos: post.mediaJson?.videos.map((video) => new VideoEntity(video)),
      },
      aggregation: {
        commentsCount: post.commentsCount,
        totalUsersSeen: post.totalUsersSeen,
      },
      linkPreview: post.linkPreview ? new LinkPreviewEntity(post.linkPreview) : undefined,
      videoIdProcessing: post.videoIdProcessing,
      markedReadImportant: post.markedReadPost,
      isSaved: post.isSaved || false,
      ownerReactions: post.ownerReactions
        ? post.ownerReactions.map((item) => ({
            id: item.id,
            reactionName: item.reactionName,
          }))
        : undefined,
    });
  }

  private _modelToArticleEntity(post: IPost): ArticleEntity {
    if (post === null) return null;
    return this._articleFactory.reconstitute({
      id: post.id,
      content: post.content,
      isReported: post.isReported,
      isHidden: post.isHidden,
      createdBy: post.createdBy,
      updatedBy: post.updatedBy,
      privacy: post.privacy,
      status: post.status,
      type: post.type,
      title: post.title,
      summary: post.summary,
      lang: post.lang,
      setting: {
        isImportant: post.isImportant,
        importantExpiredAt: post.importantExpiredAt,
        canComment: post.canComment,
        canReact: post.canReact,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      errorLog: post.errorLog,
      publishedAt: post.publishedAt,
      scheduledAt: post.scheduledAt,
      categories: post.categories?.map((category) => new CategoryEntity(category)),
      groupIds: post.groups?.map((group) => group.groupId),
      seriesIds: post.postSeries?.map((series) => series.seriesId),
      tags: post.tagsJson?.map((tag) => new TagEntity(tag)),
      aggregation: {
        commentsCount: post.commentsCount,
        totalUsersSeen: post.totalUsersSeen,
      },
      cover: post.coverJson ? new ImageEntity(post.coverJson) : null,
      wordCount: post.wordCount,
      markedReadImportant: post.markedReadPost,
      isSaved: post.isSaved || false,
      ownerReactions: post.ownerReactions
        ? post.ownerReactions.map((item) => ({
            id: item.id,
            reactionName: item.reactionName,
          }))
        : undefined,
    });
  }

  private _modelToSeriesEntity(post: IPost): SeriesEntity {
    if (post === null) return null;
    return this._seriesFactory.reconstitute({
      id: post.id,
      isReported: post.isReported,
      isHidden: post.isHidden,
      createdBy: post.createdBy,
      updatedBy: post.updatedBy,
      privacy: post.privacy,
      status: post.status,
      type: post.type,
      title: post.title,
      summary: post.summary,
      lang: post.lang,
      setting: {
        isImportant: post.isImportant,
        importantExpiredAt: post.importantExpiredAt,
        canComment: post.canComment,
        canReact: post.canReact,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      errorLog: post.errorLog,
      publishedAt: post.publishedAt,
      groupIds: post.groups?.map((group) => group.groupId),
      cover: post.coverJson ? new ImageEntity(post.coverJson) : null,
      markedReadImportant: post.markedReadPost,
      isSaved: post.isSaved || false,
      itemIds:
        post.itemIds
          ?.sort((a, b) => {
            return a.zindex - b.zindex;
          })
          .map((item) => item.postId) || [],
    });
  }

  public async getPagination(
    getPaginationContentsProps: GetPaginationContentsProps
  ): Promise<CursorPaginationResult<ArticleEntity | PostEntity | SeriesEntity>> {
    const { after, before, limit = PAGING_DEFAULT_LIMIT, order } = getPaginationContentsProps;
    const findOption = this.buildFindOptions(getPaginationContentsProps);
    const orderBuilder = this.buildOrderByOptions(getPaginationContentsProps.orderOptions);
    const cursorColumns = orderBuilder?.map((order) => order[0]);

    const paginator = new CursorPaginator(
      this._postModel,
      cursorColumns || ['createdAt'],
      { before, after, limit },
      order
    );
    const { rows, meta } = await paginator.paginate(findOption);

    return {
      rows: rows.map((row) => this._modelToEntity(row)),
      meta,
    };
  }
}
