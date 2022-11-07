import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { PageDto } from '../../../common/dto';
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
import {
  CreatePostDto,
  GetPostDto,
  GetPostEditedHistoryDto,
  SearchPostsDto,
  UpdatePostDto,
} from '../dto/requests';
import { GetDraftPostDto } from '../dto/requests/get-draft-posts.dto';
import { PostEditedHistoryDto, PostResponseDto } from '../dto/responses';
import { PostHistoryService } from '../post-history.service';
import { PostSearchService } from '../post-search.service';
import { PostService } from '../post.service';

@Injectable()
export class PostAppService {
  private _logger = new Logger(PostAppService.name);
  public constructor(
    private _postService: PostService,
    private _postSearchService: PostSearchService,
    private _postHistoryService: PostHistoryService,
    private _eventEmitter: InternalEventEmitterService,
    private _authorityService: AuthorityService,
    private _feedService: FeedService,
    private _userService: UserService,
    private _groupService: GroupService
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
    const post = await this._postService.get(postId, user, getPostDto);
    if (user) {
      this._feedService.markSeenPosts(postId, user.id).catch((ex) => {
        this._logger.error(ex, ex.stack);
      });
    }

    return post;
  }

  public async createPost(user: UserDto, createPostDto: CreatePostDto): Promise<any> {
    const { audience, setting } = createPostDto;
    if (audience.groupIds?.length > 0) {
      await this._authorityService.checkCanCreatePost(user, audience.groupIds, setting.isImportant);
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
    if (postBefore.isDraft === false && audience.groupIds.length === 0) {
      throw new BadRequestException('Audience is required');
    }
    await this._authorityService.checkCanUpdatePost(user, postBefore, audience.groupIds);

    const oldGroupIds = postBefore.audience.groups.map((group) => group.id);
    const newAudienceIds = audience.groupIds.filter((groupId) => !oldGroupIds.includes(groupId));
    if (newAudienceIds.length) {
      const isImportant = setting?.isImportant ?? postBefore.setting.isImportant;
      await this._authorityService.checkCanCreatePost(user, newAudienceIds, isImportant);
    }
    if (postBefore.isDraft === false) {
      this._postService.checkContent(updatePostDto.content, updatePostDto.media);
      const removeGroupIds = oldGroupIds.filter((id) => !audience.groupIds.includes(id));
      if (removeGroupIds.length) {
        await this._authorityService.checkCanDeletePost(user, removeGroupIds, postBefore.createdBy);
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
    const isPublished = await this._postService.publish(postId, user);
    const post = await this._postService.get(postId, user, new GetPostDto());
    if (isPublished) {
      this._eventEmitter.emit(
        new PostHasBeenPublishedEvent({
          post: post,
          actor: user.profile,
        })
      );
    }

    return post;
  }

  public async deletePost(user: UserDto, postId: string): Promise<boolean> {
    const postDeleted = await this._postService.delete(postId, user);
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

  public async searchPosts(
    user: UserDto,
    searchPostsDto: SearchPostsDto
  ): Promise<PageDto<PostResponseDto>> {
    return this._postSearchService.searchPosts(user, searchPostsDto);
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
