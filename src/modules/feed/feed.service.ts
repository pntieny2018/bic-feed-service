import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { SentryService } from '@app/sentry';
import { PageDto, PageMetaDto } from '../../common/dto';
import { IPost, PostModel } from '../../database/models/post.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { UserSeenPostModel } from '../../database/models/user-seen-post.model';
import { GroupService } from '../../shared/group';
import { UserDto } from '../auth';
import { PostResponseDto } from '../post/dto/responses';
import { PostService } from '../post/post.service';
import { GetTimelineDto } from './dto/request';
import { GetNewsFeedDto } from './dto/request/get-newsfeed.dto';
import { UserDataShareDto } from '../../shared/user/dto';
import { ExceptionHelper } from '../../common/helpers';
import { HTTP_STATUS_ID } from '../../common/constants';
import { GetUserSeenPostDto } from './dto/request/get-user-seen-post.dto';
import { UserService } from '../../shared/user';
import { GroupPrivacy } from '../../shared/group/dto';
import { PostBindingService } from '../post/post-binding.service';
import { ClassTransformer } from 'class-transformer';
import { ArticleResponseDto } from '../article/dto/responses';

@Injectable()
export class FeedService {
  private readonly _logger = new Logger(FeedService.name);
  private readonly _classTransformer = new ClassTransformer();
  public constructor(
    private readonly _userService: UserService,
    private readonly _groupService: GroupService,
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
   */
  public async getNewsFeed(authUser: UserDto, getNewsFeedDto: GetNewsFeedDto): Promise<any> {
    const { isImportant, limit, offset } = getNewsFeedDto;
    const postIdsAndSorted = await this._postService.getPostIdsInNewsFeed(authUser.id, {
      limit: limit + 1, //1 is next row
      offset,
      isImportant,
    });
    const hasNextPage = postIdsAndSorted.length === limit + 1;
    if (postIdsAndSorted.length > limit) {
      postIdsAndSorted.pop();
    }
    const posts = await this._postService.getPostsByIds(postIdsAndSorted, authUser.id);

    const postsBindedData = await this._bindAndTransformData({
      posts: posts,
      authUser,
    });

    return new PageDto<PostResponseDto>(postsBindedData, {
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

    return this._classTransformer.plainToInstance(ArticleResponseDto, postsBindedData, {
      excludeExtraneousValues: true,
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

    const authUserId = authUser?.id || null;

    const totalImportantPosts = await PostModel.getTotalImportantPostInGroups(groupIds);
    const postIdsAndSorted = [];
    if (offset < totalImportantPosts) {
      const postImportantIdsAndSorted = await this._postService.getPostIdsInGroupIds(groupIds, {
        offset,
        limit: limit + 1,
        isImportant: true,
        authUserId,
      });
      postIdsAndSorted.push(...postImportantIdsAndSorted);
    }

    if (offset + limit >= totalImportantPosts) {
      const postNormalIdsAndSorted = await this._postService.getPostIdsInGroupIds(groupIds, {
        offset: Math.max(0, offset - totalImportantPosts),
        limit: Math.min(limit + 1, limit + offset - totalImportantPosts + 1),
        isImportant: false,
        authUserId,
      });
      postIdsAndSorted.push(...postNormalIdsAndSorted);
    }
    console.log('postIdsAndSorte=', postIdsAndSorted);
    const hasNextPage = postIdsAndSorted.length === limit + 1;
    if (postIdsAndSorted.length > limit) {
      postIdsAndSorted.pop();
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

  /**
   * Delete newsfeed by post
   */
  public deleteNewsFeedByPost(postId: string, transaction: Transaction): Promise<number> {
    return this._newsFeedModel.destroy({ where: { postId }, transaction: transaction });
  }

  public deleteUserSeenByPost(postId: string, transaction: Transaction): Promise<number> {
    return this._userSeenPostModel.destroy({ where: { postId }, transaction: transaction });
  }
}
