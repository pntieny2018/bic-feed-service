import { Inject, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { FindOptions, Sequelize } from 'sequelize';
import {
  FindAllPostOptions,
  FindOnePostOptions,
  IPostRepository,
} from '../../domain/repositoty-interface/post.repository.interface';
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

  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {}

  public async upsert(postEntity: PostEntity): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const attributes = this._setAttributes(postEntity);
      await this._postModel.upsert(attributes, {
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

  private async _setGroups(postEntity: PostEntity, transaction): Promise<void> {
    const state = postEntity.get('state');
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

  private _setAttributes(postEntity): IPost {
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
      mediaJson: postEntity.get('media'),
      mentions: postEntity.get('mentionUserIds'),
    };
  }

  private async _setSeries(postEntity: PostEntity, transaction): Promise<void> {
    const state = postEntity.get('state');
    if (state.attachSeriesIds.length > 0) {
      await this._postSeriesModel.bulkCreate(
        state.attachSeriesIds.map((groupId) => ({
          postId: postEntity.get('id'),
          seriesId: state.attachSeriesIds,
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

  private async _setTags(postEntity: PostEntity, transaction): Promise<void> {
    const state = postEntity.get('state');
    if (state.attachTagIds.length > 0) {
      await this._postTagModel.bulkCreate(
        state.attachTagIds.map((groupId) => ({
          postId: postEntity.get('id'),
          tagId: state.attachTagIds,
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

  private async _s(postEntity: PostEntity, transaction): Promise<void> {
    const state = postEntity.get('state');
    if (state.attachSeriesIds.length > 0) {
      await this._postSeriesModel.bulkCreate(
        state.attachSeriesIds.map((groupId) => ({
          postId: postEntity.get('id'),
          seriesId: state.attachSeriesIds,
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
    console.log('findOption', JSON.stringify(findOption, null, 4));
    const rows = await this._postModel.findAll(findOption);
    return rows.map((row) => this._modelToPostEntity(row));
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
      const { shouldIncludeGroup, mustIncludeGroup } = options.include;
      findOption.include = [];
      if (shouldIncludeGroup || mustIncludeGroup) {
        findOption.include.push({
          model: PostGroupModel,
          as: 'groups',
          required: !shouldIncludeGroup,
          where: options.where?.groupArchived ? { isArchived: options.where.groupArchived } : {},
        });
      }
    }

    findOption.attributes = options.attributes;
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
      groupIds: post.groups?.map((group) => group.groupId),
      seriesIds: post.series?.map((series) => series.id),
      tagsIds: post.tags?.map((tag) => tag.id),
      media: {
        images: post.mediaJson?.images.map((image) => new ImageEntity(image)),
        files: post.mediaJson?.files.map((file) => new FileEntity(file)),
        videos: post.mediaJson?.videos.map((video) => new VideoEntity(video)),
      },
      aggregation: {
        commentsCount: post.commentsCount,
        totalUsersSeen: post.totalUsersSeen,
      },
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
      tagsIds: post.tags?.map((tag) => tag.id),
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
