import { SentryService } from '@libs/infra/sentry';
import { IUserService, USER_SERVICE_TOKEN, UserDto } from '@libs/service/user';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import { Transaction } from 'sequelize';

import { PageDto, PageMetaDto } from '../../common/dto';
import { DomainForbiddenException } from '../../common/exceptions';
import { IPost, PostModel } from '../../database/models/post.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { UserSeenPostModel } from '../../database/models/user-seen-post.model';
import { ArticleResponseDto } from '../article/dto/responses';
import { PostResponseDto } from '../post/dto/responses';
import { PostBindingService } from '../post/post-binding.service';
import { PostService } from '../post/post.service';
import { ReactionService } from '../reaction';
import { GROUP_APPLICATION_TOKEN, GroupApplicationService } from '../v2-group/application';
import { GroupPrivacy } from '../v2-group/data-type';

import { GetUserSeenPostDto } from './dto/request/get-user-seen-post.dto';

@Injectable()
export class FeedService {
  private readonly _logger = new Logger(FeedService.name);
  private readonly _classTransformer = new ClassTransformer();

  public constructor(
    @Inject(USER_SERVICE_TOKEN)
    private readonly _userService: IUserService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: GroupApplicationService,
    private readonly _postService: PostService,
    @InjectModel(UserNewsFeedModel)
    private _newsFeedModel: typeof UserNewsFeedModel,
    @InjectModel(UserSeenPostModel)
    private _userSeenPostModel: typeof UserSeenPostModel,
    private _sentryService: SentryService,
    private _postBindingService: PostBindingService,
    @InjectModel(PostModel)
    protected postModel: typeof PostModel
  ) {}

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
          throw new DomainForbiddenException();
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

      const users = await this._userService.findAllByIds(usersSeenPost.map((usp) => usp.userId));

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

  public async getPinnedList(groupId: string, authUser: UserDto): Promise<ArticleResponseDto[]> {
    const ids = await this._postService.getIdsPinnedInGroup(groupId, authUser?.id || null);
    if (ids.length === 0) {
      return [];
    }
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
