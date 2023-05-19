import { Inject, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Sequelize } from 'sequelize';
import {
  FindAllPostOptions,
  FindOnePostOptions,
  IPostRepository,
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
import { TagModel } from '../../../../database/models/tag.model';
import { LinkPreviewModel } from '../../../../database/models/link-preview.model';
import { LinkPreviewEntity } from '../../domain/model/link-preview';
import { TagEntity } from '../../domain/model/tag';
import { UserSeenPostModel } from '../../../../database/models/user-seen-post.model';

export class PostRepository implements IPostRepository {
  @Inject(POST_FACTORY_TOKEN) private readonly _postFactory: IPostFactory;
  @Inject(ARTICLE_FACTORY_TOKEN) private readonly _articleFactory: IArticleFactory;
  @Inject(SERIES_FACTORY_TOKEN) private readonly _seriesFactory: ISeriesFactory;
  private _logger = new Logger(PostRepository.name);
  @InjectModel(PostModel)
  private readonly _postModel: typeof PostModel;
  @InjectModel(PostGroupModel)
  private readonly _postGroupModel: typeof PostGroupModel;
  @InjectModel(PostSeriesModel)
  private readonly _postSeriesModel: typeof PostSeriesModel;
  @InjectModel(PostTagModel)
  private readonly _postTagModel: typeof PostTagModel;
  @InjectModel(TagModel)
  private readonly _tagModel: typeof TagModel;
  @InjectModel(LinkPreviewModel)
  private readonly _linkPreviewModel: typeof LinkPreviewModel;
  @InjectModel(UserSeenPostModel)
  private readonly _userSeenPostModel: typeof UserSeenPostModel;

  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}

  public async create(postEntity: ContentEntity): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const attributes = await this._getAttributes(postEntity);
      await this._postModel.create(attributes, {
        transaction,
      });

      await this._setSeries(postEntity, transaction);
      await this._setTags(postEntity, transaction);
      await this._setGroups(postEntity, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public async update(postEntity: ContentEntity): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const attributes = await this._getAttributes(postEntity);
      await this._postModel.update(attributes, {
        where: {
          id: postEntity.get('id'),
        },
        transaction,
      });

      await this._setSeries(postEntity, transaction);
      await this._setTags(postEntity, transaction);
      await this._setGroups(postEntity, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async _setGroups(postEntity: ContentEntity, transaction): Promise<void> {
    const state = postEntity.getState();
    if (state.attachGroupIds.length > 0) {
      await this._postGroupModel.bulkCreate(
        state.attachGroupIds.map((groupId) => ({
          postId: postEntity.get('id'),
          groupId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachGroupIds.length > 0) {
      await this._postGroupModel.destroy({
        where: {
          postId: postEntity.get('id'),
          groupId: state.detachGroupIds,
        },
        transaction,
      });
    }
  }

  private async _getAttributes(postEntity): Promise<IPost> {
    return {
      id: postEntity.get('id'),
      content: postEntity.get('content'),
      privacy: postEntity.get('privacy'),
      isHidden: postEntity.get('isHidden'),
      isReported: postEntity.get('isReported'),
      type: postEntity.get('type'),
      status: postEntity.get('status'),
      createdBy: postEntity.get('createdBy'),
      updatedBy: postEntity.get('updatedBy'),
      isImportant: postEntity.get('setting').isImportant,
      importantExpiredAt: postEntity.get('setting').importantExpiredAt,
      canShare: postEntity.get('setting').canShare,
      canComment: postEntity.get('setting').canComment,
      canReact: postEntity.get('setting').canReact,
      commentsCount: postEntity.get('aggregation').commentsCount,
      totalUsersSeen: postEntity.get('aggregation').totalUsersSeen,
      mediaJson: {
        files: postEntity.get('media').files.map((file) => file.toObject()),
        images: postEntity.get('media').images.map((image) => image.toObject()),
        videos: postEntity.get('media').videos.map((video) => video.toObject()),
      },
      mentions: postEntity.get('mentionUserIds'),
      cover: postEntity.get('cover'),
      videoIdProcessing: postEntity.get('videoIdProcessing'),
      tagsJson: postEntity.get('tags').map((tag) => tag.toObject()),
      linkPreview: postEntity.get('linkPreview')?.toObject() || undefined,
    };
  }

  private async _setSeries(postEntity: ContentEntity, transaction): Promise<void> {
    const state = postEntity.getState();
    if (state.attachSeriesIds.length > 0) {
      await this._postSeriesModel.bulkCreate(
        state.attachSeriesIds.map((seriesId) => ({
          postId: postEntity.get('id'),
          seriesId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachSeriesIds.length > 0) {
      await this._postSeriesModel.destroy({
        where: {
          postId: postEntity.get('id'),
          seriesId: state.detachSeriesIds,
        },
        transaction,
      });
    }
  }

  private async _setTags(postEntity: ContentEntity, transaction): Promise<void> {
    const state = postEntity.getState();
    if (state.attachTagIds.length > 0) {
      await this._postTagModel.bulkCreate(
        state.attachTagIds.map((tagId) => ({
          postId: postEntity.get('id'),
          tagId,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    if (state.detachTagIds.length > 0) {
      await this._postTagModel.destroy({
        where: {
          postId: postEntity.get('id'),
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

  public async findAll(findAllPostOptions: FindAllPostOptions): Promise<PostEntity[]> {
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
    const rows = await this._postModel.findAll(findOption);
    return rows.map((row) => this._modelToPostEntity(row));
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

  private _buildFindOptions(options: FindOnePostOptions | FindAllPostOptions): FindOptions<IPost> {
    const findOption: FindOptions<IPost> = {};
    if (options.where) {
      if (options.where['id'])
        findOption.where = {
          ...findOption.where,
          id: options.where['id'],
        };
      if (options.where['ids']) {
        findOption.where = {
          ...findOption.where,
          id: options.where['ids'],
        };
      }
      if (options.where['type']) {
        findOption.where = {
          ...findOption.where,
          type: options.where['type'],
        };
      }
    }
    if (options.include) {
      const {
        shouldIncludeSeries,
        shouldIncludeGroup,
        shouldIncludeLinkPreview,
        mustIncludeGroup,
      } = options.include;
      findOption.include = [];
      if (shouldIncludeGroup || mustIncludeGroup) {
        findOption.include.push({
          model: PostGroupModel,
          as: 'groups',
          required: !shouldIncludeGroup,
          where:
            typeof options.where?.groupArchived !== undefined
              ? { isArchived: options.where.groupArchived }
              : {},
        });
      }

      if (shouldIncludeSeries) {
        findOption.include.push({
          model: PostSeriesModel,
          as: 'postSeries',
          required: false,
          attributes: ['seriesId'],
        });
      }

      if (shouldIncludeLinkPreview) {
        findOption.include.push({
          model: LinkPreviewModel,
          as: 'linkPreview',
          required: false,
        });
      }
    }

    findOption.attributes = {
      ...findOption.attributes,
      ...options.attributes,
    };
    return findOption;
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

  private _modelToPostEntity(post: PostModel): PostEntity {
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
        canShare: post.canShare,
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
    });
  }

  private _modelToArticleEntity(post: PostModel): ArticleEntity {
    if (post === null) return null;
    return this._articleFactory.reconstitute({
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
        canShare: post.canShare,
        canComment: post.canComment,
        canReact: post.canReact,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      errorLog: post.errorLog,
      publishedAt: post.publishedAt,
      categories: post.categories?.map((category) => new CategoryEntity(category)),
      groupIds: post.groups?.map((group) => group.groupId),
      seriesIds: post.series?.map((series) => series.id),
      tags: post.tagsJson,
      cover: new ImageEntity(post.coverJson),
    });
  }

  private _modelToSeriesEntity(post: PostModel): SeriesEntity {
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
        canShare: post.canShare,
        canComment: post.canComment,
        canReact: post.canReact,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      errorLog: post.errorLog,
      publishedAt: post.publishedAt,
      groupIds: post.groups?.map((group) => group.groupId),
      cover: new ImageEntity(post.coverJson),
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
