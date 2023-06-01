import { Inject, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Op, Sequelize } from 'sequelize';
import {
  FindAllPostOptions,
  FindOnePostOptions,
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
import { getDatabaseConfig } from '../../../../config/database';
import { ReportContentDetailModel } from '../../../../database/models/report-content-detail.model';
import { UserSavePostModel } from '../../../../database/models/user-save-post.model';
import { PostReactionModel } from '../../../../database/models/post-reaction.model';
import { CategoryModel } from '../../../../database/models/category.model';

export class ContentRepository implements IContentRepository {
  LIMIT_DEFAULT = 10;
  @Inject(POST_FACTORY_TOKEN) private readonly _postFactory: IPostFactory;
  @Inject(ARTICLE_FACTORY_TOKEN) private readonly _articleFactory: IArticleFactory;
  @Inject(SERIES_FACTORY_TOKEN) private readonly _seriesFactory: ISeriesFactory;
  private _logger = new Logger(ContentRepository.name);
  @InjectModel(PostModel)
  private readonly _postModel: typeof PostModel;
  @InjectModel(PostGroupModel)
  private readonly _postGroupModel: typeof PostGroupModel;
  @InjectModel(PostSeriesModel)
  private readonly _postSeriesModel: typeof PostSeriesModel;
  @InjectModel(PostTagModel)
  private readonly _postTagModel: typeof PostTagModel;
  @InjectModel(LinkPreviewModel)
  private readonly _linkPreviewModel: typeof LinkPreviewModel;
  @InjectModel(UserSeenPostModel)
  private readonly _userSeenPostModel: typeof UserSeenPostModel;
  @InjectModel(UserMarkReadPostModel)
  private readonly _userReadImportantPostModel: typeof UserMarkReadPostModel;

  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}

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

  public async update(contentEntity: PostEntity | ArticleEntity | SeriesEntity): Promise<void> {
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
      createdBy: postEntity.get('createdBy'),
      updatedBy: postEntity.get('updatedBy'),
      isImportant: postEntity.get('setting')?.isImportant,
      importantExpiredAt: postEntity.get('setting')?.importantExpiredAt || null,
      canComment: postEntity.get('setting')?.canComment,
      canReact: postEntity.get('setting')?.canReact,
      commentsCount: postEntity.get('aggregation')?.commentsCount || 0,
      totalUsersSeen: postEntity.get('aggregation')?.totalUsersSeen || 0,
      linkPreviewId: postEntity.get('linkPreview')?.get('id'),
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

  public async delete(id: string): Promise<void> {
    await this._postModel.destroy({ where: { id } });
  }

  public async findOne(
    findOnePostOptions: FindOnePostOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    const findOption = this._buildFindOptions(findOnePostOptions);
    const entity = await this._postModel.findOne(findOption);
    return this._modelToEntity(entity);
  }

  public async findAll(
    findAllPostOptions: FindAllPostOptions
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]> {
    const include = [];
    if (findAllPostOptions.include) {
      const { shouldIncludeGroup, mustIncludeGroup } = findAllPostOptions.include;
      if (shouldIncludeGroup || mustIncludeGroup) {
        include.push({
          model: PostGroupModel,
          as: 'groups',
          required: !shouldIncludeGroup,
          where: findAllPostOptions.where?.groupArchived
            ? { isArchived: findAllPostOptions.where.groupArchived }
            : {},
        });
      }
    }
    const findOption = this._buildFindOptions(findAllPostOptions);
    findOption.limit = findAllPostOptions.limit || this.LIMIT_DEFAULT;
    findOption.order = this._getOrderContent(findAllPostOptions.order);

    const rows = await this._postModel.findAll(findOption);
    return rows.map((row) => this._modelToEntity(row));
  }

  private _getOrderContent(orderOptions: OrderOptions) {
    if (!orderOptions) return [];
    const order = [];
    if (orderOptions.isImportantFirst) {
      order.push([this._sequelizeConnection.literal('"colImportant"'), 'desc']);
    }
    order.push(['createdAt', 'desc']);
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

  private _buildFindOptions(options: FindOnePostOptions | FindAllPostOptions): FindOptions<IPost> {
    const { schema } = getDatabaseConfig();
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;
    const userSavePostTable = UserSavePostModel.tableName;
    const findOption: FindOptions<IPost> = {};
    findOption.where = this._getCondition(options).where;
    const includeAttr = [];
    if (options.include) {
      const {
        shouldIncludeSeries,
        shouldIncludeGroup,
        shouldIncludeLinkPreview,
        shouldIncludeCategory,
        shouldIncludeSaved,
        shouldIncludeReaction,
        shouldIncludeMarkReadImportant,
        shouldIncludeImportant,
        shouldIncludeItems,
        mustIncludeGroup,
      } = options.include;
      if (shouldIncludeGroup || mustIncludeGroup) {
        includeAttr.push({
          model: PostGroupModel,
          as: 'groups',
          required: !shouldIncludeGroup,
          where: options.where.groupArchived ? { isArchived: options.where.groupArchived } : {},
        });
      }

      if (shouldIncludeSeries) {
        includeAttr.push({
          model: PostSeriesModel,
          as: 'postSeries',
          required: false,
          attributes: ['seriesId'],
        });
      }

      if (shouldIncludeItems) {
        includeAttr.push({
          model: PostModel,
          as: 'itemIds',
          required: false,
          attributes: ['postId'],
        });
      }

      if (shouldIncludeLinkPreview) {
        includeAttr.push({
          model: LinkPreviewModel,
          as: 'linkPreview',
          required: false,
        });
      }
      if (shouldIncludeReaction?.userId) {
        includeAttr.push({
          model: PostReactionModel,
          as: 'ownerReactions',
          required: false,
          where: {
            createdBy: shouldIncludeReaction.userId,
          },
        });
      }
      if (shouldIncludeCategory) {
        includeAttr.push({
          model: CategoryModel,
          as: 'categories',
          required: false,
          through: {
            attributes: [],
          },
          attributes: ['id', 'name'],
        });
      }

      if (shouldIncludeSaved) {
        if (shouldIncludeSaved.userId) {
          includeAttr.push([
            Sequelize.literal(`(
                  COALESCE((SELECT true FROM ${schema}.${userSavePostTable} as r
                  WHERE r.post_id = "PostModel".id AND r.user_id = ${this._postModel.sequelize.escape(
                    shouldIncludeSaved.userId
                  )}), false)
              )`),
            'isSaved',
          ]);
        } else {
          includeAttr.push([Sequelize.literal(`(false)`), 'isSaved']);
        }
      }

      if (shouldIncludeMarkReadImportant) {
        if (shouldIncludeMarkReadImportant.userId) {
          includeAttr.push([
            Sequelize.literal(`(
                  COALESCE((SELECT true FROM ${schema}.${userMarkReadPostTable} as r
                  WHERE r.post_id = "PostModel".id AND r.user_id = ${this._postModel.sequelize.escape(
                    shouldIncludeMarkReadImportant.userId
                  )}), false)
              )`),
            'markedReadPost',
          ]);
        } else {
          includeAttr.push([Sequelize.literal(`(false)`), 'markedReadPost']);
        }
      }

      if (shouldIncludeImportant) {
        if (shouldIncludeImportant.userId) {
          includeAttr.push([
            Sequelize.literal(`(
          CASE WHEN is_important = TRUE AND COALESCE((SELECT TRUE FROM ${schema}.${userMarkReadPostTable} as r
          WHERE r.post_id = "PostModel".id AND r.user_id = ${this._postModel.sequelize.escape(
            shouldIncludeImportant.userId
          )}), FALSE) = FALSE THEN 1 ELSE 0 END
               )`),
            'colImportant',
          ]);
        } else {
          includeAttr.push([Sequelize.literal(`"PostModel".is_important`), 'colImportant']);
        }
      }
    }

    findOption.attributes = {
      include: [...includeAttr],
    };
    return findOption;
  }

  private _getCondition(options: FindOnePostOptions | FindAllPostOptions): FindOptions<IPost> {
    const findOption: FindOptions<IPost> = {};
    const { schema } = getDatabaseConfig();
    const reportContentDetailTable = ReportContentDetailModel.tableName;
    const userSavePostTable = UserSavePostModel.tableName;
    const postGroupTable = PostGroupModel.tableName;
    if (options.where) {
      const condition = [];
      if (options.where['id'])
        condition.push({
          id: options.where['id'],
        });
      if (options.where['ids']) {
        condition.push({
          id: options.where['ids'],
        });
      }
      if (options.where.type) {
        condition.push({
          type: options.where.type,
        });
      }

      if (options.where.isImportant) {
        condition.push({
          isImportant: options.where.isImportant,
        });
      }

      if (options.where.status) {
        condition.push({
          status: options.where.status,
        });
      }

      if (options.where.createdBy) {
        condition.push({
          createdBy: options.where.createdBy,
        });
      }

      if (options.where.isHidden !== undefined) {
        condition.push({
          isHidden: options.where.isHidden,
        });
      }

      if (options.where.excludeReportedByUserId) {
        condition.push(
          Sequelize.literal(
            `NOT EXISTS ( 
                      SELECT target_id FROM  ${schema}.${reportContentDetailTable} rp
                        WHERE rp.target_id = "PostModel".id AND rp.created_by = ${this._postModel.sequelize.escape(
                          options.where.excludeReportedByUserId
                        )}
                    )`
          )
        );
      }
      if (options.where.savedByUserId) {
        condition.push(
          Sequelize.literal(
            `EXISTS ( 
                      SELECT sp.user_id FROM  ${schema}.${userSavePostTable} sp
                        WHERE sp.post_id = "PostModel".id AND sp.user_id = ${this._postModel.sequelize.escape(
                          options.where.savedByUserId
                        )}
                    )`
          )
        );
      }
      if (options.where.groupId) {
        condition.push(
          Sequelize.literal(
            `EXISTS ( 
                      SELECT g.group_id FROM  ${schema}.${postGroupTable} g
                        WHERE g.post_id = "PostModel".id ${
                          options.where.groupArchived ? ` AND g.is_archived = TRUE}` : ``
                        }  AND g.group_id = ${this._postModel.sequelize.escape(
              options.where.groupId
            )}
              )`
          )
        );
      }
      if (condition.length) {
        findOption.where = {
          [Op.and]: condition,
        };
      }
    }
    return findOption;
  }

  private _modelToEntity(post: PostModel): PostEntity | ArticleEntity | SeriesEntity {
    if (post === null) return null;
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
      mentionUserIds: post.mentions,
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
      items: post.items?.map((item) => {
        if (item.type === PostType.ARTICLE) {
          return this._modelToArticleEntity(item);
        } else if (item.type === PostType.POST) {
          return this._modelToPostEntity(item);
        }
      }),
    });
  }
}
