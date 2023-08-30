import { CONTENT_STATUS, CONTENT_TYPE, LANGUAGE, ORDER, PRIVACY } from '@beincom/constants';
import {
  ILibContentRepository,
  LIB_CONTENT_REPOSITORY_TOKEN,
} from '@libs/database/postgres/repository/interface';
import { Inject } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { isBoolean } from 'lodash';
import { FindOptions, Includeable, Op, Sequelize, Transaction, WhereOptions } from 'sequelize';
import { Literal } from 'sequelize/types/utils';

import { PAGING_DEFAULT_LIMIT } from '../../../../common/constants';
import { CursorPaginator } from '../../../../common/dto';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { CategoryModel } from '../../../../database/models/category.model';
import { LinkPreviewModel } from '../../../../database/models/link-preview.model';
import { PostGroupModel } from '../../../../database/models/post-group.model';
import { PostReactionModel } from '../../../../database/models/post-reaction.model';
import { PostSeriesModel } from '../../../../database/models/post-series.model';
import { IPost, PostModel, PostType } from '../../../../database/models/post.model';
import { QuizModel } from '../../../../database/models/quiz.model';
import { ContentNotFoundException } from '../../domain/exception';
import {
  ARTICLE_FACTORY_TOKEN,
  IArticleFactory,
  IPostFactory,
  ISeriesFactory,
  POST_FACTORY_TOKEN,
  SERIES_FACTORY_TOKEN,
} from '../../domain/factory/interface';
import { CategoryEntity } from '../../domain/model/category';
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
import { LinkPreviewEntity } from '../../domain/model/link-preview';
import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';
import { QuizEntity } from '../../domain/model/quiz';
import { QuizParticipantEntity } from '../../domain/model/quiz-participant';
import { TagEntity } from '../../domain/model/tag';
import {
  FindContentProps,
  GetPaginationContentsProps,
  IContentRepository,
  OffsetPaginationProps,
  OrderOptions,
} from '../../domain/repositoty-interface';
import { ContentMapper } from '../mapper/content.mapper';

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
    @Inject(LIB_CONTENT_REPOSITORY_TOKEN)
    private readonly _libContentRepository: ILibContentRepository,
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
      await this._libContentRepository.update(model.id, model, transaction);

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
      await this._libContentRepository.bulkCreatePostGroup(
        state.attachGroupIds.map((groupId) => ({
          postId: postEntity.getId(),
          groupId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachGroupIds?.length > 0) {
      await this._libContentRepository.destroyPostGroup(
        {
          postId: postEntity.getId(),
          groupId: state.detachGroupIds,
        },
        transaction
      );
    }
  }

  private async _setSeries(
    contentEntity: PostEntity | ArticleEntity,
    transaction: Transaction
  ): Promise<void> {
    const state = contentEntity.getState();
    if (state.attachSeriesIds.length > 0) {
      await this._libContentRepository.bulkCreatePostSeries(
        state.attachSeriesIds.map((seriesId) => ({
          postId: contentEntity.getId(),
          seriesId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachSeriesIds.length > 0) {
      await this._libContentRepository.destroyPostSeries(
        {
          postId: contentEntity.getId(),
          seriesId: state.detachSeriesIds,
        },
        transaction
      );
    }
  }

  private async _setTags(
    contentEntity: PostEntity | ArticleEntity,
    transaction: Transaction
  ): Promise<void> {
    const state = contentEntity.getState();
    if (state.attachTagIds.length > 0) {
      await this._libContentRepository.bulkCreatePostTag(
        state.attachTagIds.map((tagId) => ({
          postId: contentEntity.getId(),
          tagId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachTagIds.length > 0) {
      await this._libContentRepository.destroyPostTag(
        {
          postId: contentEntity.getId(),
          tagId: state.detachTagIds,
        },
        transaction
      );
    }
  }

  private async _setCategories(
    contentEntity: ArticleEntity,
    transaction: Transaction
  ): Promise<void> {
    const state = contentEntity.getState();
    if (state.attachCategoryIds.length > 0) {
      await this._libContentRepository.bulkCreatePostCategory(
        state.attachCategoryIds.map((categoryId) => ({
          postId: contentEntity.getId(),
          categoryId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachCategoryIds.length > 0) {
      await this._libContentRepository.destroyPostCategory(
        {
          postId: contentEntity.getId(),
          categoryId: state.detachCategoryIds,
        },
        transaction
      );
    }
  }

  public async delete(id: string): Promise<void> {
    return this._libContentRepository.delete(id);
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
    const content = await this._postModel.findByPk(contentId);
    if (!content) {
      throw new ContentNotFoundException();
    }

    return this._modelToEntity(content);
  }

  public async findAll(
    findAllPostOptions: FindContentProps,
    offsetPaginate?: OffsetPaginationProps
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]> {
    const articles = await this._libContentRepository.findAll(findAllPostOptions, offsetPaginate);
    return articles.map((article) => this._contentMapper.toDomain(article));
  }

  protected buildOrderByOptions(orderOptions: OrderOptions): any {
    if (!orderOptions) {
      return undefined;
    }
    const order = [];
    if (orderOptions.isImportantFirst) {
      order.push([this._sequelizeConnection.literal('"isReadImportant"'), ORDER.DESC]);
    }
    if (orderOptions.isPublishedByDesc) {
      order.push(['publishedAt', ORDER.DESC]);
    }
    order.push(['createdAt', ORDER.DESC]);
    return order;
  }

  public async markSeen(postId: string, userId: string): Promise<void> {
    return this._libContentRepository.bulkCreateSeenPost(
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
    return this._libContentRepository.bulkCreateReadImportantPost(
      [
        {
          postId,
          userId,
        },
      ],
      { ignoreDuplicates: true }
    );
  }

  private _buildSubSelect(options: FindContentProps): [Literal, string][] {
    if (!options?.include) {
      return [];
    }

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

  private _buildRelationOptions(options: FindContentProps): Includeable[] {
    if (!options?.include) {
      return [];
    }

    const includeable = [];
    const { groupArchived, groupIds } = options.where || {};
    const {
      shouldIncludeSeries,
      shouldIncludeGroup,
      shouldIncludeLinkPreview,
      shouldIncludeCategory,
      shouldIncludeQuiz,
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

    if (shouldIncludeQuiz) {
      includeable.push({
        model: QuizModel,
        as: 'quiz',
        required: false,
        attributes: [
          'id',
          'title',
          'description',
          'status',
          'genStatus',
          'createdBy',
          'createdAt',
          'updatedAt',
        ],
      });
    }

    if (shouldIncludeCategory) {
      includeable.push({
        model: CategoryModel,
        as: 'categories',
        required: false,
        attributes: ['id', 'name'],
      });
    }

    return includeable;
  }

  protected buildFindOptions(options: FindContentProps): FindOptions<IPost> {
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

  private _buildWhereOptions(options: FindContentProps): WhereOptions<IPost> {
    let whereOptions: WhereOptions<IPost> | undefined;

    if (options?.where) {
      const conditions = [];
      if (options.where.id) {
        conditions.push({
          id: options.where.id,
        });
      }

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
    }

    return whereOptions;
  }

  private _modelToEntity(post: PostModel): PostEntity | ArticleEntity | SeriesEntity {
    if (post === null) {
      return null;
    }
    post = post.toJSON();
    switch (post.type) {
      case PostType.POST:
        return this._modelToPostEntity(post);
      case PostType.SERIES:
        return this._modelToSeriesEntity(post);
      case PostType.ARTICLE:
        return this._modelToArticleEntity(post);
      default:
        return null;
    }
  }

  private _modelToPostEntity(post: IPost): PostEntity {
    if (post === null) {
      return null;
    }
    return this._postFactory.reconstitute({
      id: post.id,
      isReported: post.isReported,
      isHidden: post.isHidden,
      createdBy: post.createdBy,
      updatedBy: post.updatedBy,
      privacy: post.privacy as unknown as PRIVACY,
      status: post.status as unknown as CONTENT_STATUS,
      type: post.type as unknown as CONTENT_TYPE,
      lang: post.lang as unknown as LANGUAGE,
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
      quiz: post.quiz
        ? new QuizEntity({
            id: post.quiz.id,
            contentId: post.quiz.postId,
            title: post.quiz.title,
            description: post.quiz.description,
            status: post.quiz.status,
            genStatus: post.quiz.genStatus,
            timeLimit: post.quiz.timeLimit,
            createdAt: post.quiz.createdAt,
            createdBy: post.quiz.createdBy,
          })
        : undefined,
      quizResults: (post.quizResults || []).map(
        (quizResult) =>
          new QuizParticipantEntity({
            id: quizResult.id,
            quizId: quizResult.quizId,
            contentId: quizResult.postId,
            quizSnapshot: quizResult.quizSnapshot,
            timeLimit: quizResult.timeLimit,
            score: quizResult.score,
            isHighest: quizResult.isHighest,
            totalAnswers: quizResult.totalAnswers,
            totalCorrectAnswers: quizResult.totalCorrectAnswers,
            startedAt: quizResult.startedAt,
            finishedAt: quizResult.finishedAt,
            answers: [],
            updatedBy: quizResult.updatedBy,
            updatedAt: quizResult.updatedAt,
            createdAt: quizResult.createdAt,
            createdBy: quizResult.createdBy,
          })
      ),
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
    if (post === null) {
      return null;
    }
    return this._articleFactory.reconstitute({
      id: post.id,
      content: post.content,
      isReported: post.isReported,
      isHidden: post.isHidden,
      createdBy: post.createdBy,
      updatedBy: post.updatedBy,
      privacy: post.privacy as unknown as PRIVACY,
      status: post.status as unknown as CONTENT_STATUS,
      type: post.type as unknown as CONTENT_TYPE,
      title: post.title,
      summary: post.summary,
      lang: post.lang as unknown as LANGUAGE,
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
      quiz: post.quiz
        ? new QuizEntity({
            id: post.quiz.id,
            contentId: post.quiz.postId,
            title: post.quiz.title,
            description: post.quiz.description,
            status: post.quiz.status,
            genStatus: post.quiz.genStatus,
            timeLimit: post.quiz.timeLimit,
            createdAt: post.quiz.createdAt,
            createdBy: post.quiz.createdBy,
          })
        : undefined,
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
    if (post === null) {
      return null;
    }
    return this._seriesFactory.reconstitute({
      id: post.id,
      isReported: post.isReported,
      isHidden: post.isHidden,
      createdBy: post.createdBy,
      updatedBy: post.updatedBy,
      privacy: post.privacy as unknown as PRIVACY,
      status: post.status as unknown as CONTENT_STATUS,
      type: post.type as unknown as CONTENT_TYPE,
      title: post.title,
      summary: post.summary,
      lang: post.lang as unknown as LANGUAGE,
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
