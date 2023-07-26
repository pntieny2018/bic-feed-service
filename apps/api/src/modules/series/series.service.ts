import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import { Transaction } from 'sequelize';
import { NIL } from 'uuid';
import { HTTP_STATUS_ID } from '../../common/constants';
import { LogicException } from '../../common/exceptions';
import { ArrayHelper } from '../../common/helpers';
import { PostGroupModel } from '../../database/models/post-group.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { PostSeriesModel } from '../../database/models/post-series.model';
import { IPost, PostModel, PostType } from '../../database/models/post.model';
import { CommentService } from '../comment';
import { PostBindingService } from '../post/post-binding.service';
import { GetSeriesDto } from './dto/requests';
import { SeriesResponseDto } from './dto/responses';
import { PostHelper } from '../post/post.helper';
import { PostService } from '../post/post.service';
import { UserDto } from '../v2-user/application';

@Injectable()
export class SeriesService {
  /**
   * Logger
   * @private
   */
  private _logger = new Logger(SeriesService.name);

  /**
   *  ClassTransformer
   * @private
   */
  private _classTransformer = new ClassTransformer();

  public constructor(
    @InjectModel(PostModel)
    private _postModel: typeof PostModel,
    @InjectModel(PostSeriesModel)
    private _postSeriesModel: typeof PostSeriesModel,
    @InjectModel(PostGroupModel)
    private _postGroupModel: typeof PostGroupModel,
    private readonly _commentService: CommentService,
    private readonly _postBinding: PostBindingService,
    @Inject(forwardRef(() => PostService))
    private readonly _postService: PostService
  ) {}

  /**
   * Get Series
   */
  public async get(
    id: string,
    authUser: UserDto,
    getSeriesDto?: GetSeriesDto
  ): Promise<SeriesResponseDto> {
    const series = PostHelper.filterArchivedPost(
      await this._postModel.findOne({
        attributes: {
          include: [
            ['cover_json', 'coverMedia'],
            PostModel.loadMarkReadPost(authUser.id),
            PostModel.loadSaved(authUser.id),
          ],
        },
        where: { id, type: PostType.SERIES },
        include: [
          {
            model: PostGroupModel,
            as: 'groups',
            required: false,
            attributes: ['groupId'],
            where: { isArchived: false },
          },
          {
            model: PostReactionModel,
            as: 'ownerReactions',
            required: false,
            where: {
              createdBy: authUser.id,
            },
          },
        ],
      })
    );

    if (!series) {
      throw new LogicException(HTTP_STATUS_ID.APP_ARTICLE_NOT_EXISTING);
    }
    let comments = null;
    if (getSeriesDto.withComment) {
      comments = await this._commentService.getComments(
        {
          postId: id,
          parentId: NIL,
          childLimit: getSeriesDto.childCommentLimit,
          order: getSeriesDto.commentOrder,
          childOrder: getSeriesDto.childCommentOrder,
          limit: getSeriesDto.commentLimit,
        },
        authUser,
        false
      );
    }
    const jsonArticle = series.toJSON();

    const seriesBindedData = await this._postBinding.bindRelatedData([jsonArticle], {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser,
    });
    await this._postBinding.bindCommunity(seriesBindedData);
    const result = this._classTransformer.plainToInstance(SeriesResponseDto, seriesBindedData, {
      excludeExtraneousValues: true,
    });
    result[0]['comments'] = comments;
    result[0].items = await this._postService.getItemsInSeries(id, authUser);
    return result[0];
  }

  public async addGroup(
    groupIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    if (groupIds.length === 0) return;
    const postGroupDataCreate = groupIds.map((groupId) => ({
      postId: postId,
      groupId,
    }));
    await this._postGroupModel.bulkCreate(postGroupDataCreate, { transaction });
  }

  /**
   * Delete/Insert group by post
   */
  public async setGroupByPost(
    groupIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<boolean> {
    const currentGroups = await this._postGroupModel.findAll({
      where: { postId },
    });
    const currentGroupIds = currentGroups.map((i) => i.groupId);

    const deleteGroupIds = ArrayHelper.arrDifferenceElements(currentGroupIds, groupIds);
    if (deleteGroupIds.length) {
      await this._postGroupModel.destroy({
        where: { groupId: deleteGroupIds, postId },
        transaction,
      });
    }

    const addGroupIds = ArrayHelper.arrDifferenceElements(groupIds, currentGroupIds);
    if (addGroupIds.length) {
      await this._postGroupModel.bulkCreate(
        addGroupIds.map((groupId) => ({
          postId,
          groupId,
        })),
        { transaction }
      );
    }
    return true;
  }

  /**
   * Add Article/Post to Series
   */
  public async addItems(series: IPost, postIds: string[]): Promise<IPost> {
    try {
      const dataInsert = [];
      const maxIndex: number = await this._postSeriesModel.max('zindex', {
        where: {
          seriesId: series.id,
        },
      });
      let zindex = maxIndex || 0;
      for (const postId of postIds) {
        zindex += 1;
        dataInsert.push({
          seriesId: series.id,
          postId: postId,
          zindex,
        });
      }
      await this._postSeriesModel.bulkCreate(dataInsert, { ignoreDuplicates: true });

      return series;
    } catch (error) {
      this._logger.error(JSON.stringify(error?.stack));
      throw error;
    }
  }

  /**
   * Remove articles/posts From Series
   */
  public async removeItems(series: IPost, postIds: string[]): Promise<void> {
    try {
      for (const postId of postIds) {
        await this._postSeriesModel.destroy({
          where: {
            seriesId: series.id,
            postId,
          },
        });
      }
    } catch (error) {
      this._logger.error(JSON.stringify(error?.stack));
      throw error;
    }
  }

  /**
   * Add post to series
   */
  public async addToPost(
    seriesIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    if (seriesIds.length === 0) return;
    const dataCreate = seriesIds.map((seriesId) => ({
      postId: postId,
      seriesId,
    }));
    await this._postSeriesModel.bulkCreate(dataCreate, { transaction });
  }

  /**
   * Delete/Insert series by post
   */
  public async updateToPost(
    seriesIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    const currentSeries = await this._postSeriesModel.findAll({
      where: { postId },
    });
    const currentSeriesIds = currentSeries.map((i) => i.seriesId);

    const deleteSeriesIds = ArrayHelper.arrDifferenceElements(currentSeriesIds, seriesIds);
    if (deleteSeriesIds.length) {
      await this._postSeriesModel.destroy({
        where: { seriesId: deleteSeriesIds, postId },
        transaction,
      });
    }

    const addSeriesIds = ArrayHelper.arrDifferenceElements(seriesIds, currentSeriesIds);
    if (addSeriesIds.length) {
      const dataInsert = [];
      for (const seriesId of addSeriesIds) {
        const maxIndexArticlesInSeries: number = await this._postSeriesModel.max('zindex', {
          where: {
            seriesId,
          },
        });
        dataInsert.push({
          postId,
          seriesId,
          zindex: maxIndexArticlesInSeries + 1,
        });
      }

      await this._postSeriesModel.bulkCreate(dataInsert, { transaction });
    }
  }

  public async reorderItems(id: string, postIds: string[]): Promise<void> {
    let zindex = 0;
    for (const postId of postIds) {
      await this._postSeriesModel.update(
        {
          zindex,
        },
        {
          where: {
            postId,
            seriesId: id,
          },
        }
      );
      zindex++;
    }
  }

  public async findSeriesById(
    id: string,
    options: {
      withGroups?: boolean;
      withItemId?: boolean;
    }
  ): Promise<IPost> {
    const include = [];
    if (options.withGroups) {
      include.push({
        model: PostGroupModel,
        as: 'groups',
        required: false,
        where: {
          isArchived: false,
        },
        attributes: ['groupId'],
      });
    }
    if (options.withItemId) {
      include.push({
        model: PostModel,
        as: 'items',
        required: false,
        through: {
          attributes: ['zindex', 'createdAt'],
        },
        attributes: [
          'id',
          'title',
          'summary',
          'createdBy',
          'canComment',
          'canReact',
          'status',
          'type',
          'content',
          'createdAt',
          'updated_at',
          'importantExpiredAt',
        ],
      });
    }
    const result = await this._postModel.findOne({
      include,
      where: {
        id,
      },
    });

    return result;
  }
}
