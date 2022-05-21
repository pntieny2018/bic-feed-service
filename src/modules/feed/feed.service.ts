import { Op } from 'sequelize';
import { UserDto } from '../auth';
import { MentionService } from '../mention';
import { ReactionService } from '../reaction';
import { GetTimelineDto } from './dto/request';
import { GroupService } from '../../shared/group';
import { PostService } from '../post/post.service';
import { ClassTransformer } from 'class-transformer';
import { OrderEnum, PageDto } from '../../common/dto';
import { PostResponseDto } from '../post/dto/responses';
import { getDatabaseConfig } from '../../config/database';
import { PostModel } from '../../database/models/post.model';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';
import { MediaModel } from '../../database/models/media.model';
import { GetNewsFeedDto } from './dto/request/get-newsfeed.dto';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { MentionModel } from '../../database/models/mention.model';
import { PostGroupModel } from '../../database/models/post-group.model';
import { PostMediaModel } from '../../database/models/post-media.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';
import { Inject, Logger, Injectable, forwardRef, BadRequestException, Post } from '@nestjs/common';
import { UserSeenPostModel } from '../../database/models/user-seen-post.model';

@Injectable()
export class FeedService {
  private readonly _logger = new Logger(FeedService.name);
  private _classTransformer = new ClassTransformer();

  public constructor(
    private readonly _reactionService: ReactionService,
    private readonly _groupService: GroupService,
    private readonly _mentionService: MentionService,
    @Inject(forwardRef(() => PostService))
    private readonly _postService: PostService,
    @InjectModel(UserNewsFeedModel)
    private _newsFeedModel: typeof UserNewsFeedModel,
    @InjectModel(UserSeenPostModel)
    private _userSeenPostModel: typeof UserSeenPostModel,
    @InjectModel(PostModel) private readonly _postModel: typeof PostModel,
    @InjectConnection()
    private _sequelizeConnection: Sequelize
  ) {}

  /**
   * Get NewsFeed
   * @param authUser number
   * @param getNewsFeedDto GetNewsFeedDto
   * @returns Promise resolve PageDto
   * @throws HttpException
   */
  public async getNewsFeed(authUser: UserDto, getNewsFeedDto: GetNewsFeedDto): Promise<any> {
    const { limit, offset } = getNewsFeedDto;
    try {
      const authUserId = authUser.id;
      const constraints = FeedService._getIdConstrains(getNewsFeedDto);
      const totalImportantPosts = await PostModel.getTotalImportantPostInNewsFeed(
        authUserId,
        constraints
      );
      let importantPostsExc = Promise.resolve([]);
      if (offset < totalImportantPosts) {
        importantPostsExc = PostModel.getNewsFeedData({
          ...getNewsFeedDto,
          limit: limit + 1,
          authUserId,
          isImportant: true,
        });
      }

      let normalPostsExc = Promise.resolve([]);
      if (offset + limit >= totalImportantPosts) {
        normalPostsExc = PostModel.getNewsFeedData({
          ...getNewsFeedDto,
          offset: Math.max(0, offset - totalImportantPosts),
          limit: Math.min(limit + 1, limit + offset - totalImportantPosts + 1),
          authUserId,
          isImportant: false,
        });
      }

      const [importantPosts, normalPosts] = await Promise.all([importantPostsExc, normalPostsExc]);
      const rows = importantPosts.concat(normalPosts);

      let normalSeenPost = [];
      if (limit >= rows.length) {
        const unSeenCount = await this._newsFeedModel.count({
          where: { isSeenPost: false, userId: authUserId },
        });
        normalSeenPost = await PostModel.getNewsFeedData({
          ...getNewsFeedDto,
          offset: Math.max(0, offset - unSeenCount),
          limit: Math.min(limit + 1, limit + offset - unSeenCount + 1),
          authUserId,
          isImportant: false,
          isSeen: true,
        });
      }

      const posts = this.groupPosts(rows.concat(normalSeenPost));

      const hasNextPage = posts.length === limit + 1 ? true : false;
      if (hasNextPage) posts.pop();

      await Promise.all([
        this._reactionService.bindReactionToPosts(posts),
        this._mentionService.bindMentionsToPosts(posts),
        this._postService.bindActorToPost(posts),
        this._postService.bindAudienceToPost(posts),
      ]);
      const result = this._classTransformer.plainToInstance(PostResponseDto, posts, {
        excludeExtraneousValues: true,
      });
      return new PageDto<PostResponseDto>(result, {
        limit,
        offset,
        hasNextPage,
      });
    } catch (e) {
      this._logger.error(e, e.stack);
      return new PageDto<PostResponseDto>([], {
        limit,
        offset,
        hasNextPage: false,
      });
    }
  }

  public async markSeenPosts(postIds: number[], userId: number): Promise<void> {
    try {
      await this._userSeenPostModel.bulkCreate(
        postIds.map((postId) => ({ postId, userId })),
        { ignoreDuplicates: true }
      );

      await this._newsFeedModel.update(
        { isSeenPost: true },
        {
          where: { userId, postId: { [Op.in]: postIds } },
        }
      );
    } catch (ex) {
      this._logger.error(ex, ex.stack);
    }
  }

  /**
   * Get Timeline
   * @param authUser UserDto
   * @param getTimelineDto GetTimelineDto
   * @returns Promise resolve PageDto
   * @throws HttpException
   */
  public async getTimeline(authUser: UserDto, getTimelineDto: GetTimelineDto): Promise<any> {
    const { limit, offset, groupId } = getTimelineDto;
    const group = await this._groupService.get(groupId);
    if (!group) {
      throw new BadRequestException(`Group ${groupId} not found`);
    }
    const groupIds = this._groupService.getGroupIdsCanAccess(group, authUser);
    if (groupIds.length === 0) {
      return new PageDto<PostResponseDto>([], {
        limit,
        offset,
        hasNextPage: false,
      });
    }
    const authUserId = authUser.id;
    const constraints = FeedService._getIdConstrains(getTimelineDto);

    const totalImportantPosts = await PostModel.getTotalImportantPostInGroups(
      authUserId,
      groupIds,
      constraints
    );
    let importantPostsExc = Promise.resolve([]);
    if (offset < totalImportantPosts) {
      importantPostsExc = PostModel.getTimelineData({
        ...getTimelineDto,
        limit: limit + 1,
        groupIds,
        authUser,
        isImportant: true,
      });
    }
    let normalPostsExc = Promise.resolve([]);
    if (offset + limit >= totalImportantPosts) {
      normalPostsExc = PostModel.getTimelineData({
        ...getTimelineDto,
        offset: Math.max(0, offset - totalImportantPosts),
        limit: Math.min(limit + 1, limit + offset - totalImportantPosts + 1),
        groupIds,
        authUser,
        isImportant: false,
      });
    }
    const [importantPosts, normalPosts] = await Promise.all([importantPostsExc, normalPostsExc]);
    console.log('importantPosts=', importantPosts);
    console.log('normalPosts=', normalPosts);
    const rows = importantPosts.concat(normalPosts);
    const posts = this.groupPosts(rows);
    const hasNextPage = posts.length === limit + 1 ? true : false;
    if (hasNextPage) posts.pop();
    await Promise.all([
      this._reactionService.bindReactionToPosts(posts),
      this._mentionService.bindMentionsToPosts(posts),
      this._postService.bindActorToPost(posts),
      this._postService.bindAudienceToPost(posts),
    ]);
    const result = this._classTransformer.plainToInstance(PostResponseDto, posts, {
      excludeExtraneousValues: true,
    });

    return new PageDto<PostResponseDto>(result, {
      limit,
      offset,
      hasNextPage,
    });
  }

  /**
   * Get id constrains
   * @param getTimelineDto GetTimelineDto
   * @returns object
   */
  private static _getIdConstrains(getTimelineDto: GetTimelineDto | GetNewsFeedDto): string {
    let constraints = '';
    if (getTimelineDto.idGT) {
      constraints += 'AND p.id > :idGT';
    }
    if (getTimelineDto.idGTE) {
      constraints += 'AND p.id >= :idGTE';
    }
    if (getTimelineDto.idLT) {
      constraints += 'AND p.id < :idLT';
    }
    if (getTimelineDto.idLTE) {
      constraints += 'AND p.id <= :idLTE';
    }
    return constraints;
  }

  /**
   * Delete newsfeed by post
   * @param postId number
   * @param transaction Transaction
   * @returns object
   */
  public async deleteNewsFeedByPost(postId: number, transaction: Transaction): Promise<number> {
    return await this._newsFeedModel.destroy({ where: { postId }, transaction: transaction });
  }

  public groupPosts(posts: any[]): any[] {
    const result = [];
    posts.forEach((post) => {
      const {
        id,
        commentsCount,
        isImportant,
        importantExpiredAt,
        isDraft,
        content,
        markedReadPost,
        canComment,
        canReact,
        canShare,
        createdBy,
        updatedBy,
        createdAt,
        updatedAt,
        isNowImportant,
      } = post;
      const postAdded = result.find((i) => i.id === post.id);
      if (!postAdded) {
        const groups = post.groupId === null ? [] : [{ groupId: post.groupId }];
        const mentions = post.userId === null ? [] : [{ userId: post.userId }];
        const ownerReactions =
          post.postReactionId === null
            ? []
            : [
                {
                  id: post.postReactionId,
                  reactionName: post.reactionName,
                  createdAt: post.reactCreatedAt,
                },
              ];
        const media =
          post.mediaId === null
            ? []
            : [
                {
                  id: post.mediaId,
                  url: post.url,
                  name: post.name,
                  type: post.type,
                  width: post.width,
                  height: post.height,
                  extension: post.extension,
                },
              ];
        result.push({
          id,
          commentsCount,
          isImportant,
          importantExpiredAt,
          isDraft,
          content,
          canComment,
          markedReadPost,
          canReact,
          canShare,
          createdBy,
          updatedBy,
          createdAt,
          updatedAt,
          isNowImportant,
          groups,
          mentions,
          media,
          ownerReactions,
        });
        return;
      }
      if (post.groupId !== null && !postAdded.groups.find((g) => g.groupId === post.groupId)) {
        postAdded.groups.push({ groupId: post.groupId });
      }
      if (post.userId !== null && !postAdded.mentions.find((m) => m.userId === post.userId)) {
        postAdded.mentions.push({ userId: post.userId });
      }
      if (
        post.postReactionId !== null &&
        !postAdded.ownerReactions.find((m) => m.id === post.postReactionId)
      ) {
        postAdded.ownerReactions.push({
          id: post.postReactionId,
          reactionName: post.reactionName,
          createdAt: post.reactCreatedAt,
        });
      }
      if (post.mediaId !== null && !postAdded.media.find((m) => m.id === post.mediaId)) {
        postAdded.media.push({
          id: post.mediaId,
          url: post.url,
          name: post.name,
          type: post.type,
          width: post.width,
          height: post.height,
          extension: post.extension,
        });
      }
    });
    return result;
  }
}
