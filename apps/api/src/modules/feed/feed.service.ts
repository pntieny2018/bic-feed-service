import { SentryService } from '@app/sentry';
import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import { Transaction } from 'sequelize';
import { HTTP_STATUS_ID } from '../../common/constants';
import { PageDto, PageMetaDto } from '../../common/dto';
import { ExceptionHelper } from '../../common/helpers';
import { IPost, PostModel } from '../../database/models/post.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { UserSeenPostModel } from '../../database/models/user-seen-post.model';
import { ArticleResponseDto } from '../article/dto/responses';
import { PostResponseDto } from '../post/dto/responses';
import { PostBindingService } from '../post/post-binding.service';
import { PostService } from '../post/post.service';
import { GetTimelineDto } from './dto/request';
import { GetNewsFeedDto } from './dto/request/get-newsfeed.dto';
import { GetUserSeenPostDto } from './dto/request/get-user-seen-post.dto';
import { IUserApplicationService, USER_APPLICATION_TOKEN, UserDto } from '../v2-user/application';
import { GROUP_APPLICATION_TOKEN, GroupApplicationService } from '../v2-group/application';
import { GroupPrivacy } from '../v2-group/data-type';
import { AuthorityService } from '../authority';
import { ReactionService } from '../reaction';

@Injectable()
export class FeedService {
  private readonly _logger = new Logger(FeedService.name);
  private readonly _classTransformer = new ClassTransformer();

  public constructor(
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userService: IUserApplicationService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: GroupApplicationService,
    @Inject(forwardRef(() => PostService))
    private readonly _postService: PostService,
    @InjectModel(UserNewsFeedModel)
    private _newsFeedModel: typeof UserNewsFeedModel,
    @InjectModel(UserSeenPostModel)
    private _userSeenPostModel: typeof UserSeenPostModel,
    private _sentryService: SentryService,
    private _postBindingService: PostBindingService,
    @InjectModel(PostModel)
    protected postModel: typeof PostModel,
    private _authorityService: AuthorityService
  ) {}

  /**
   * Get NewsFeed
   */
  public async getNewsFeed(authUser: UserDto, getNewsFeedDto: GetNewsFeedDto): Promise<any> {
    const { isImportant, type, isSaved, isMine, limit, offset } = getNewsFeedDto;
    let postIdsAndSorted = [];
    if (isSaved) {
      postIdsAndSorted = await this._postService.getListSavedByUserId(authUser.id, {
        limit: limit + 1, //1 is next row
        offset,
        type,
      });
    } else {
      postIdsAndSorted = await this._postService.getPostIdsInNewsFeed(authUser.id, {
        limit: limit + 1, //1 is next row
        offset,
        isImportant,
        type,
        createdBy: isMine ? authUser.id : null,
      });
    }

    if (postIdsAndSorted.length === 0) {
      return new PageDto<PostResponseDto>([], {
        limit,
        offset,
        hasNextPage: false,
      });
    }

    let hasNextPage = false;
    if (postIdsAndSorted.length > limit) {
      postIdsAndSorted.pop();
      hasNextPage = true;
    }
    const posts = await this._postService.getPostsByIds(postIdsAndSorted, authUser.id);

    const postsBoundData = await this._bindAndTransformData({
      posts: posts,
      authUser,
    });

    return new PageDto<PostResponseDto>(postsBoundData, {
      limit,
      offset,
      hasNextPage,
    });
  }

  private async _bindAndTransformData({
    posts,
    authUser,
  }: {
    posts: IPost[];
    authUser: UserDto;
  }): Promise<ArticleResponseDto[]> {
    const postsBindedData = await this._postBindingService.bindRelatedData(posts, {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser,
    });

    await this._postBindingService.bindCommunity(posts);
    return this._classTransformer.plainToInstance(ArticleResponseDto, postsBindedData, {
      excludeExtraneousValues: true,
    });
  }

  private async _bindAndTransformReportedData({
    posts,
    authUser,
  }: {
    posts: IPost[];
    authUser: UserDto;
  }): Promise<ArticleResponseDto[]> {
    const postsBindData = await this._postBindingService.bindRelatedData(posts, {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudienceReported: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser,
    });

    await this._postBindingService.bindCommunity(posts);
    return this._classTransformer.plainToInstance(ArticleResponseDto, postsBindData, {
      excludeExtraneousValues: true,
    });
  }

  public async getUsersSeenPosts(
    user: UserDto,
    getUserSeenPostDto: GetUserSeenPostDto
  ): Promise<PageDto<UserDto>> {
    try {
      const { postId } = getUserSeenPostDto;

      const post = await this._postService.findPost({
        postId: postId,
      });
      const groupsOfUser = user.groups;
      const groupIds = post.groups.map((g) => g.groupId);
      const groupInfos = await this._groupAppService.findAllByIds(groupIds);

      const privacy = groupInfos.map((g) => g.privacy);

      if (privacy.every((p) => p !== GroupPrivacy.CLOSED && p !== GroupPrivacy.OPEN)) {
        if (!groupIds.some((groupId) => groupsOfUser.includes(groupId))) {
          ExceptionHelper.throwLogicException(HTTP_STATUS_ID.API_FORBIDDEN);
        }
      }

      const usersSeenPost = await this._userSeenPostModel.findAll({
        where: {
          postId: postId,
        },
        order: [['createdAt', 'DESC']],
        limit: getUserSeenPostDto?.limit || 20,
        offset: getUserSeenPostDto?.offset || 0,
      });

      const total = await this._userSeenPostModel.count({
        where: {
          postId: postId,
        },
      });

      const users = await this._userService.findAllAndFilterByPersonalVisibility(
        usersSeenPost.map((usp) => usp.userId),
        user.id
      );

      return new PageDto<UserDto>(
        users,
        new PageMetaDto({
          total: total ?? 0,
          pageOptionsDto: {
            limit: getUserSeenPostDto?.limit || 20,
            offset: getUserSeenPostDto?.offset || 0,
          },
        })
      );
    } catch (ex) {
      this._logger.error(JSON.stringify(ex?.stack));
      this._sentryService.captureException(ex);
      throw ex;
    }
  }
  /**
   * Get Timeline
   */
  public async getTimeline(authUser: UserDto, getTimelineDto: GetTimelineDto): Promise<any> {
    const { limit, offset, groupId, isImportant, type, isSaved, isMine } = getTimelineDto;
    const group = await this._groupAppService.findOne(groupId);
    if (!group) {
      throw new BadRequestException(`Group ${groupId} not found`);
    }
    const groupIds = this._groupAppService.getGroupIdAndChildIdsUserJoined(group, authUser.groups);
    if (groupIds.length === 0) {
      return new PageDto<PostResponseDto>([], {
        limit,
        offset,
        hasNextPage: false,
      });
    }

    const authUserId = authUser?.id || null;
    let postIdsAndSorted = [];
    if (isMine) {
      postIdsAndSorted = await this._postService.getListByUserId(authUserId, {
        limit: limit + 1, //1 is next row
        offset,
        type,
        groupIds,
      });
    } else if (isSaved) {
      postIdsAndSorted = await this._postService.getListSavedByUserId(authUserId, {
        limit: limit + 1, //1 is next row
        offset,
        type,
        groupIds,
      });
    } else {
      postIdsAndSorted = await this._postService.getPostIdsInGroupIds(groupIds, {
        offset,
        limit: limit + 1,
        authUserId,
        isImportant,
        type,
      });
    }

    let hasNextPage = false;
    if (postIdsAndSorted.length > limit) {
      postIdsAndSorted.pop();
      hasNextPage = true;
    }
    const posts = await this._postService.getPostsByIds(postIdsAndSorted, authUserId);
    const postsBindedData = await this._bindAndTransformData({
      posts,
      authUser,
    });

    return new PageDto<PostResponseDto>(postsBindedData, {
      limit,
      offset,
      hasNextPage,
    });
  }

  public async getContentBlockedOfMe(
    authUser: UserDto,
    postIdsAndSorted: string[],
    paging: {
      limit: number;
      offset: number;
      hasNextPage: boolean;
    }
  ): Promise<PageDto<PostResponseDto>> {
    try {
      const posts = await this._postService.getPostsByIds(postIdsAndSorted, authUser.id);
      const postsBindData = await this._bindAndTransformReportedData({
        posts,
        authUser,
      });
      return new PageDto<PostResponseDto>(postsBindData, paging);
    } catch (ex) {
      this._logger.error(ex, ex?.stack);
      return new PageDto<PostResponseDto>([], paging);
    }
  }

  /**
   * Delete newsfeed by post
   */
  public deleteNewsFeedByPost(postId: string, transaction: Transaction): Promise<number> {
    return this._newsFeedModel.destroy({ where: { postId }, transaction: transaction });
  }

  public deleteUserSeenByPost(postId: string, transaction: Transaction): Promise<number> {
    return this._userSeenPostModel.destroy({ where: { postId }, transaction: transaction });
  }

  public async getPinnedList(groupId: string, authUser: UserDto): Promise<ArticleResponseDto[]> {
    const ids = await this._postService.getIdsPinnedInGroup(groupId, authUser?.id || null);
    if (ids.length === 0) return [];
    const posts = await this._postService.getPostsByIds(ids, authUser?.id || null);
    const postsBoundData = await this._bindAndTransformData({
      posts,
      authUser,
    });

    return (postsBoundData || []).map((post) => ({
      ...post,
      reactionsCount: ReactionService.transformReactionFormat(post.reactionsCount),
    }));
  }
}
