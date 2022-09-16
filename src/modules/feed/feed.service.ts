import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import { Transaction } from 'sequelize';
import { SentryService } from '@app/sentry';
import { PageDto, PageMetaDto } from '../../common/dto';
import { PostModel } from '../../database/models/post.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { UserSeenPostModel } from '../../database/models/user-seen-post.model';
import { GroupService } from '../../shared/group';
import { UserDto } from '../auth';
import { MentionService } from '../mention';
import { PostResponseDto } from '../post/dto/responses';
import { PostService } from '../post/post.service';
import { ReactionService } from '../reaction';
import { GetTimelineDto } from './dto/request';
import { GetNewsFeedDto } from './dto/request/get-newsfeed.dto';
import { UserDataShareDto } from '../../shared/user/dto';
import { ExceptionHelper } from '../../common/helpers';
import { HTTP_STATUS_ID } from '../../common/constants';
import { GetUserSeenPostDto } from './dto/request/get-user-seen-post.dto';
import { UserService } from '../../shared/user';
import { GroupPrivacy } from '../../shared/group/dto';
import { PostBindingService } from '../post/post-binding.service';

@Injectable()
export class FeedService {
  private readonly _logger = new Logger(FeedService.name);
  private _classTransformer = new ClassTransformer();

  public constructor(
    @Inject(forwardRef(() => ReactionService))
    private readonly _reactionService: ReactionService,
    private readonly _userService: UserService,
    private readonly _groupService: GroupService,
    private readonly _mentionService: MentionService,
    @Inject(forwardRef(() => PostService))
    private readonly _postService: PostService,
    @InjectModel(UserNewsFeedModel)
    private _newsFeedModel: typeof UserNewsFeedModel,
    @InjectModel(UserSeenPostModel)
    private _userSeenPostModel: typeof UserSeenPostModel,
    private _sentryService: SentryService,
    private _postBindingService: PostBindingService
  ) {}

  /**
   * Get NewsFeed
   * @param authUser number
   * @param getNewsFeedDto GetNewsFeedDto
   * @returns Promise resolve PageDto
   * @throws HttpException
   */
  public async getNewsFeed(authUser: UserDto, getNewsFeedDto: GetNewsFeedDto): Promise<any> {
    const { isImportant, limit, offset } = getNewsFeedDto;
    const authUserId = authUser.id;
    const constraints = PostModel.getIdConstrains(getNewsFeedDto);
    let totalImportantPosts = 0;
    let importantPostsExc = Promise.resolve([]);

    const hasGetImportantPost = isImportant || isImportant === null;
    if (hasGetImportantPost) {
      totalImportantPosts = await PostModel.getTotalImportantPostInNewsFeed(
        authUserId,
        constraints
      );

      if (offset < totalImportantPosts) {
        importantPostsExc = PostModel.getNewsFeedData({
          ...getNewsFeedDto,
          limit: limit + 1,
          authUserId,
          isImportant: true,
        });
      }
    }

    let normalPostsExc = Promise.resolve([]);
    const isNeedMorePost = offset + limit >= totalImportantPosts;
    const hasGetNormalPost = isImportant === false || isImportant === null;
    if (isNeedMorePost && hasGetNormalPost) {
      const normalLimit = Math.min(limit + 1, limit + offset - totalImportantPosts + 1);
      normalPostsExc = PostModel.getNewsFeedData({
        ...getNewsFeedDto,
        offset: Math.max(0, offset - totalImportantPosts),
        limit: Math.max(0, normalLimit),
        authUserId,
        isImportant: false,
      });
    }

    return this._bindAndTransformData({
      importantPostsExc,
      normalPostsExc,
      offset,
      limit,
      authUser,
    });
  }

  private async _bindAndTransformData({
    importantPostsExc,
    normalPostsExc,
    offset,
    limit,
    authUser,
  }: {
    importantPostsExc: any;
    normalPostsExc: any;
    offset: number;
    limit: number;
    authUser: UserDto;
  }): Promise<PageDto<PostResponseDto>> {
    const [importantPosts, normalPosts] = await Promise.all([importantPostsExc, normalPostsExc]);
    const rows = importantPosts.concat(normalPosts);
    const posts = this._postService.group(rows);
    const hasNextPage = posts.length === limit + 1;
    if (hasNextPage) posts.pop();
    const result = await this._postBindingService.bindRelatedData(posts, {
      shouldBindReation: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser,
    });
    return new PageDto<PostResponseDto>(result, {
      limit,
      offset,
      hasNextPage,
    });
  }

  public async getUsersSeenPots(
    user: UserDto,
    getUserSeenPostDto: GetUserSeenPostDto
  ): Promise<PageDto<UserDataShareDto>> {
    try {
      const { postId } = getUserSeenPostDto;

      const post = await this._postService.findPost({
        postId: postId,
      });
      const groupsOfUser = user.profile.groups;
      const groupIds = post.groups.map((g) => g.groupId);
      const groupInfos = await this._groupService.getMany(groupIds);

      const privacy = groupInfos.map((g) => g.privacy);

      if (privacy.every((p) => p !== GroupPrivacy.OPEN && p !== GroupPrivacy.PUBLIC)) {
        if (!this._groupService.isMemberOfSomeGroups(groupIds, groupsOfUser)) {
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

      const users = await this._userService.getMany(usersSeenPost.map((usp) => usp.userId));

      return new PageDto<UserDataShareDto>(
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
      this._logger.error(ex, ex.stack);
      this._sentryService.captureException(ex);
      throw ex;
    }
  }

  public async markSeenPosts(postId: string, userId: string): Promise<void> {
    try {
      const exist = await this._userSeenPostModel.findOne({
        where: {
          postId: postId,
          userId: userId,
        },
      });
      if (!exist) {
        await this._userSeenPostModel.create(
          {
            postId: postId,
            userId: userId,
          },
          { ignoreDuplicates: true }
        );

        await this._newsFeedModel.update(
          { isSeenPost: true },
          {
            where: { userId, postId },
          }
        );
      }
    } catch (ex) {
      this._logger.error(ex, ex.stack);
      this._sentryService.captureException(ex);
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
    if (!authUser && group.privacy !== GroupPrivacy.PUBLIC) {
      return new PageDto<PostResponseDto>([], {
        limit,
        offset,
        hasNextPage: false,
      });
    }
    const groupIds = this._groupService.getGroupIdsCanAccess(group, authUser);
    if (groupIds.length === 0) {
      return new PageDto<PostResponseDto>([], {
        limit,
        offset,
        hasNextPage: false,
      });
    }
    const constraints = PostModel.getIdConstrains(getTimelineDto);

    const totalImportantPosts = await PostModel.getTotalImportantPostInGroups(
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
    return this._bindAndTransformData({
      importantPostsExc,
      normalPostsExc,
      offset,
      limit,
      authUser,
    });
  }

  /**
   * Delete newsfeed by post
   * @param postId string
   * @param transaction Transaction
   * @returns object
   */
  public deleteNewsFeedByPost(postId: string, transaction: Transaction): Promise<number> {
    return this._newsFeedModel.destroy({ where: { postId }, transaction: transaction });
  }

  public deleteUserSeenByPost(postId: string, transaction: Transaction): Promise<number> {
    return this._userSeenPostModel.destroy({ where: { postId }, transaction: transaction });
  }
}
