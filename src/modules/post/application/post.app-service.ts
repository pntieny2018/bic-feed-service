import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { HTTP_STATUS_ID } from '../../../common/constants';
import { PageDto } from '../../../common/dto';
import { LogicException } from '../../../common/exceptions';
import { ExceptionHelper } from '../../../common/helpers';
import {
  PostHasBeenDeletedEvent,
  PostHasBeenPublishedEvent,
  PostHasBeenUpdatedEvent,
} from '../../../events/post';
import { GroupService } from '../../../shared/group';
import { UserService } from '../../../shared/user';
import { UserDto } from '../../auth';
import { AuthorityService } from '../../authority';
import { FeedService } from '../../feed/feed.service';
import { TargetType } from '../../report-content/contstants';
import { CreatePostDto, GetPostDto, GetPostEditedHistoryDto, UpdatePostDto } from '../dto/requests';
import { GetDraftPostDto } from '../dto/requests/get-draft-posts.dto';
import { PostEditedHistoryDto, PostResponseDto } from '../dto/responses';
import { PostHistoryService } from '../post-history.service';
import { PostService } from '../post.service';
import { IPost } from '../../../database/models/post.model';
import { IPostGroup } from '../../../database/models/post-group.model';

@Injectable()
export class PostAppService {
  private _logger = new Logger(PostAppService.name);
  public constructor(
    private _postService: PostService,
    private _postHistoryService: PostHistoryService,
    private _eventEmitter: InternalEventEmitterService,
    private _authorityService: AuthorityService,
    private _feedService: FeedService,
    private _userService: UserService,
    private _groupService: GroupService,
    protected authorityService: AuthorityService
  ) {}

  public getDraftPosts(
    user: UserDto,
    getDraftPostDto: GetDraftPostDto
  ): Promise<PageDto<PostResponseDto>> {
    return this._postService.getDrafts(user.id, getDraftPostDto);
  }

  public async getPost(
    user: UserDto,
    postId: string,
    getPostDto: GetPostDto
  ): Promise<PostResponseDto> {
    getPostDto.hideSecretAudienceCanNotAccess = true;
    const postIdsReported = await this._postService.getEntityIdsReportedByUser(user.id, [
      TargetType.POST,
    ]);
    if (postIdsReported.includes(postId)) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }
    const postResponseDto = await this._postService.get(postId, user, getPostDto);

    const post = {
      privacy: postResponseDto.privacy,
      createdBy: postResponseDto.createdBy,
      isDraft: postResponseDto.isDraft,
      groups: postResponseDto.audience.groups.map(
        (g) =>
          ({
            groupId: g.id,
          } as IPostGroup)
      ),
    } as IPost;

    if (user) {
      await this.authorityService.checkCanReadPost(user, post);
    } else {
      await this.authorityService.checkIsPublicPost(post);
    }

    if (user) {
      this._feedService.markSeenPosts(postId, user.id).catch((ex) => {
        this._logger.error(ex, ex.stack);
      });
    }

    return postResponseDto;
  }

  public async createPost(user: UserDto, createPostDto: CreatePostDto): Promise<any> {
    const { audience, setting } = createPostDto;
    if (audience.groupIds?.length > 0) {
      const isEnableSetting =
        setting.isImportant ||
        setting.canComment === false ||
        setting.canReact === false ||
        setting.canShare === false;
      await this._authorityService.checkCanCreatePost(user, audience.groupIds, isEnableSetting);
    }
    const created = await this._postService.create(user, createPostDto);
    if (created) {
      return this._postService.get(created.id, user, new GetPostDto());
    }
  }

  public async getTotalDraft(user: UserDto): Promise<any> {
    return this._postService.getTotalDraft(user);
  }

  public async updatePost(
    user: UserDto,
    postId: string,
    updatePostDto: UpdatePostDto
  ): Promise<PostResponseDto> {
    const { audience, setting } = updatePostDto;
    const postBefore = await this._postService.get(postId, user, new GetPostDto());
    if (!postBefore) ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);

    await this._authorityService.checkPostOwner(postBefore, user.id);
    if (postBefore.isDraft === false) {
      if (audience.groupIds.length === 0) throw new BadRequestException('Audience is required');

      let isEnableSetting = false;
      if (
        setting &&
        (setting.isImportant ||
          setting.canComment === false ||
          setting.canReact === false ||
          setting.canShare === false)
      ) {
        isEnableSetting = true;
      }
      this._postService.checkContent(updatePostDto.content, updatePostDto.media);
      const oldGroupIds = postBefore.audience.groups.map((group) => group.id);
      await this._authorityService.checkCanUpdatePost(user, oldGroupIds, isEnableSetting);
      this._authorityService.checkUserInSomeGroups(user, oldGroupIds);
      const newAudienceIds = audience.groupIds.filter((groupId) => !oldGroupIds.includes(groupId));
      if (newAudienceIds.length) {
        await this._authorityService.checkCanCreatePost(user, newAudienceIds, isEnableSetting);
      }
      const removeGroupIds = oldGroupIds.filter((id) => !audience.groupIds.includes(id));
      if (removeGroupIds.length) {
        await this._authorityService.checkCanDeletePost(user, removeGroupIds);
      }
    }

    const isUpdated = await this._postService.update(postBefore, user, updatePostDto);
    if (isUpdated) {
      const postUpdated = await this._postService.get(postId, user, new GetPostDto());
      this._eventEmitter.emit(
        new PostHasBeenUpdatedEvent({
          oldPost: postBefore,
          newPost: postUpdated,
          actor: user.profile,
        })
      );

      return postUpdated;
    }
  }

  public async publishPost(user: UserDto, postId: string): Promise<PostResponseDto> {
    const post = await this._postService.get(postId, user, new GetPostDto());
    if (!post) ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    if (post.isDraft === false) return post;

    await this._authorityService.checkPostOwner(post, user.id);
    const { audience, setting } = post;
    if (audience.groups.length === 0) throw new BadRequestException('Audience is required');

    const groupIds = audience.groups.map((group) => group.id);
    const isEnableSetting =
      setting.isImportant ||
      setting.canComment === false ||
      setting.canReact === false ||
      setting.canShare === false;
    await this._authorityService.checkCanCreatePost(user, groupIds, isEnableSetting);

    this._postService.checkContent(post.content, post.media);

    const postUpdated = await this._postService.publish(post, user);
    this._eventEmitter.emit(
      new PostHasBeenPublishedEvent({
        post: postUpdated,
        actor: user.profile,
      })
    );

    return postUpdated;
  }

  public async deletePost(user: UserDto, postId: string): Promise<boolean> {
    const posts = await this._postService.getListWithGroupsByIds([postId], false);

    if (posts.length === 0) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }
    await this._authorityService.checkPostOwner(posts[0], user.id);

    if (posts[0].isDraft === false) {
      await this._authorityService.checkCanDeletePost(
        user,
        posts[0].groups.map((g) => g.groupId)
      );
    }

    const postDeleted = await this._postService.delete(posts[0], user);
    if (postDeleted) {
      this._eventEmitter.emit(
        new PostHasBeenDeletedEvent({
          post: postDeleted,
          actor: user.profile,
        })
      );
      return true;
    }
    return false;
  }

  public async markReadPost(user: UserDto, postId: string): Promise<boolean> {
    await this._postService.markRead(postId, user.id);
    return true;
  }

  public async savePost(user: UserDto, postId: string): Promise<boolean> {
    await this._postService.checkExistAndPublished(postId);
    await this._postService.savePostToUserCollection(postId, user.id);
    return true;
  }

  public async unSavePost(user: UserDto, postId: string): Promise<boolean> {
    await this._postService.checkExistAndPublished(postId);
    await this._postService.unSavePostToUserCollection(postId, user.id);
    return true;
  }

  public getEditedHistory(
    user: UserDto,
    postId: string,
    getPostEditedHistoryDto: GetPostEditedHistoryDto
  ): Promise<PageDto<PostEditedHistoryDto>> {
    return this._postHistoryService.getEditedHistory(user, postId, getPostEditedHistoryDto);
  }

  public async getUserGroup(groupId: string, userId: string, postId: string): Promise<any> {
    const user = await this._userService.get(userId);
    const group = await this._groupService.get(groupId);
    const post = await this._postService.findPost({ postId });
    return {
      group,
      user,
      post,
    };
  }
}
