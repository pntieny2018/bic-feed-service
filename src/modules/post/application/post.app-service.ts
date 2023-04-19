import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { HTTP_STATUS_ID } from '../../../common/constants';
import { PageDto } from '../../../common/dto';
import { ExceptionHelper } from '../../../common/helpers';
import { IPostGroup, PostGroupModel } from '../../../database/models/post-group.model';
import { IPost, PostModel, PostStatus } from '../../../database/models/post.model';
import {
  PostHasBeenDeletedEvent,
  PostHasBeenPublishedEvent,
  PostHasBeenUpdatedEvent,
} from '../../../events/post';
import { AuthorityService } from '../../authority';
import { CreatePostDto, GetPostDto, GetPostEditedHistoryDto, UpdatePostDto } from '../dto/requests';
import { GetDraftPostDto } from '../dto/requests/get-draft-posts.dto';
import { PostEditedHistoryDto, PostResponseDto } from '../dto/responses';
import { PostHistoryService } from '../post-history.service';
import { PostService } from '../post.service';
import { TagService } from '../../tag/tag.service';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../v2-user/application';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../v2-group/application';
import { ContentNotFoundException } from '../../v2-post/exception/content-not-found.exception';
import { GetAudienceContentDto } from '../dto/requests/get-audience-content.response.dto';
import { AudienceNoBelongContentException } from '../../v2-post/exception/audience-no-belong-content.exception';
import { InjectModel } from '@nestjs/sequelize';
import { ContentPinNotFoundException } from '../../v2-post/exception/content-pin-not-found.exception';
import { ContentPinLackException } from '../../v2-post/exception/content-pin-lack.exception';
import { ExternalService } from '../../../app/external.service';
import { MediaService } from '../../media';
import { MediaMarkAction, MediaType } from '../../../database/models/media.model';
import { LogicException } from '../../../common/exceptions';
import { TargetType } from '../../report-content/contstants';

@Injectable()
export class PostAppService {
  private _logger = new Logger(PostAppService.name);

  public constructor(
    private _postService: PostService,
    private _postHistoryService: PostHistoryService,
    private _eventEmitter: InternalEventEmitterService,
    private _authorityService: AuthorityService,
    @Inject(USER_APPLICATION_TOKEN)
    private _userAppService: IUserApplicationService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private _groupAppService: IGroupApplicationService,
    protected authorityService: AuthorityService,
    private _tagService: TagService,
    @InjectModel(PostModel)
    protected postModel: typeof PostModel,
    private _externalService: ExternalService,
    private _mediaService: MediaService
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

    const postResponseDto = await this._postService.get(postId, user, getPostDto);

    if (
      (postResponseDto.isHidden || postResponseDto.status !== PostStatus.PUBLISHED) &&
      postResponseDto.createdBy !== user?.id
    ) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }

    if (user) {
      const postIdsReported = await this._postService.getEntityIdsReportedByUser(user.id, [
        TargetType.POST,
      ]);
      if (postIdsReported.includes(postId) && postResponseDto.actor.id !== user.id) {
        throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
      }
    }

    const post = {
      privacy: postResponseDto.privacy,
      createdBy: postResponseDto.createdBy,
      type: postResponseDto.type,
      status: postResponseDto.status,
      groups: postResponseDto.audience.groups.map(
        (g) =>
          ({
            groupId: g.id,
          } as IPostGroup)
      ),
    } as IPost;

    if (user) {
      await this.authorityService.checkCanReadPost(user, post, postResponseDto.audience.groups);
    } else {
      await this.authorityService.checkIsPublicPost(post);
    }

    if (user) {
      this.markSeenPost(postId, user.id).catch((ex) => {
        this._logger.error(JSON.stringify(ex?.stack));
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
    const { audience, setting, tags, series, media } = updatePostDto;
    const postBefore = await this._postService.get(postId, user, new GetPostDto());
    if (!postBefore) ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);

    const currentImageIds = postBefore.media.images.map((image) => image.id);
    const currentVideoIds = postBefore.media.videos.map((video) => video.id);
    const currentFileIds = postBefore.media.files.map((file) => file.id);

    const newImageIds = media.images.map((image) => image.id);
    const newVideoIds = media.videos.map((video) => video.id);
    const newFileIds = media.files.map((file) => file.id);

    const imageIdsNeedToAdd = newImageIds.filter((id) => !currentImageIds.includes(id));
    const videoIdsNeedToAdd = newVideoIds.filter((id) => !currentVideoIds.includes(id));
    const fileIdsNeedToAdd = newFileIds.filter((id) => !currentFileIds.includes(id));

    //const imageIdsNeedToRemove = currentImageIds.filter((id) => !newImageIds.includes(id));
    const videoIdsNeedToRemove = currentVideoIds.filter((id) => !newVideoIds.includes(id));
    const fileIdsNeedToRemove = currentFileIds.filter((id) => !newFileIds.includes(id));

    if (imageIdsNeedToAdd.length) {
      const images = await this._externalService.getImageIds(newImageIds);
      if (images.length < imageIdsNeedToAdd.length) {
        throw new BadRequestException('Invalid image');
      }
      if (images.some((video) => video.createdBy !== user.id)) {
        throw new BadRequestException('You must be owner this cover');
      }
      if (images.some((image) => image.createdBy !== user.id || image.status !== 'DONE')) {
        throw new BadRequestException('Image is not ready to use');
      }
      updatePostDto.media.images = images;
    } else {
      updatePostDto.media.images = postBefore.media.images.filter((item) =>
        newImageIds.includes(item.id)
      );
    }

    if (videoIdsNeedToAdd.length) {
      const videos = await this._externalService.getVideoIds(newImageIds);
      if (videos.length < videoIdsNeedToAdd.length) {
        throw new BadRequestException('Invalid video');
      }
      if (videos.some((video) => video.createdBy !== user.id)) {
        throw new BadRequestException('You must be owner this cover');
      }
      updatePostDto.media.videos = videos;
    } else {
      updatePostDto.media.videos = postBefore.media.videos.filter((item) =>
        newVideoIds.includes(item.id)
      );
    }

    if (fileIdsNeedToAdd.length) {
      const files = await this._externalService.getVideoIds(newFileIds);
      if (files.length < fileIdsNeedToAdd.length) {
        throw new BadRequestException('Invalid file');
      }
      if (files.some((video) => video.createdBy !== user.id)) {
        throw new BadRequestException('You must be owner this cover');
      }
      updatePostDto.media.files = files;
    } else {
      updatePostDto.media.files = postBefore.media.files.filter((item) =>
        newFileIds.includes(item.id)
      );
    }

    await this._authorityService.checkPostOwner(postBefore, user.id);
    if (postBefore.status === PostStatus.PUBLISHED) {
      if (audience.groupIds.length === 0) {
        throw new BadRequestException('Audience is required');
      }

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
      await this._authorityService.checkCanUpdatePost(user, oldGroupIds, false);
      this._authorityService.checkUserInSomeGroups(user, oldGroupIds);
      const newAudienceIds = audience.groupIds.filter((groupId) => !oldGroupIds.includes(groupId));
      if (newAudienceIds.length) {
        await this._authorityService.checkCanCreatePost(user, newAudienceIds, isEnableSetting);
      }
      const removeGroupIds = oldGroupIds.filter((id) => !audience.groupIds.includes(id));
      if (removeGroupIds.length) {
        await this._authorityService.checkCanDeletePost(user, removeGroupIds);
      }
      await this.isSeriesAndTagsValid(audience.groupIds, series, tags);
    }

    const isUpdated = await this._postService.update(postBefore, user, updatePostDto);
    if (isUpdated) {
      const postUpdated = await this._postService.get(postId, user, new GetPostDto());
      this._eventEmitter.emit(
        new PostHasBeenUpdatedEvent({
          oldPost: postBefore,
          newPost: postUpdated,
          actor: user,
        })
      );

      if (videoIdsNeedToAdd) {
        await this._mediaService.emitMediaToUploadService(
          MediaType.VIDEO,
          MediaMarkAction.USED,
          videoIdsNeedToAdd
        );
      }
      if (fileIdsNeedToAdd) {
        await this._mediaService.emitMediaToUploadService(
          MediaType.FILE,
          MediaMarkAction.USED,
          fileIdsNeedToAdd
        );
      }

      if (videoIdsNeedToRemove) {
        await this._mediaService.emitMediaToUploadService(
          MediaType.VIDEO,
          MediaMarkAction.DELETE,
          videoIdsNeedToRemove
        );
      }

      if (fileIdsNeedToRemove) {
        await this._mediaService.emitMediaToUploadService(
          MediaType.FILE,
          MediaMarkAction.DELETE,
          fileIdsNeedToRemove
        );
      }
      return postUpdated;
    }
  }

  public async publishPost(user: UserDto, postId: string): Promise<PostResponseDto> {
    const post = await this._postService.get(postId, user, new GetPostDto());
    if (!post) ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    if (post.status === PostStatus.PUBLISHED) return post;

    await this._preCheck(post, user);

    const postUpdated = await this._postService.publish(post, user);
    this.markSeenPost(postUpdated.id, user.id);
    postUpdated.totalUsersSeen = Math.max(postUpdated.totalUsersSeen, 1);
    this._eventEmitter.emit(
      new PostHasBeenPublishedEvent({
        post: postUpdated,
        actor: user,
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

    if (posts[0].status === PostStatus.PUBLISHED) {
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
          actor: user,
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

  public async getAudience(
    postId: string,
    user: UserDto,
    getAudienceContentDto: GetAudienceContentDto
  ): Promise<any> {
    const post = await this._postService.getGroupsByPostId(postId);
    if (!post) {
      throw new ContentNotFoundException();
    }
    const groups = post.groups || [];
    const listPinPostIds = {};
    const groupIds = [];
    groups.forEach((group) => {
      groupIds.push(group.groupId);
      listPinPostIds[group.groupId] = group.isPinned;
    });
    let dataGroups = await this._groupAppService.findAllByIds(groupIds);

    if (getAudienceContentDto.pinnable) {
      dataGroups = await this._authorityService.getAudienceCanPin(dataGroups, user);
    }
    return {
      groups: dataGroups.map((group) => ({
        id: group.id,
        name: group.name,
        isPinned: listPinPostIds[group.id],
      })),
    };
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

  public async markSeenPost(postId: string, userId: string): Promise<void> {
    await this._postService.markSeenPost(postId, userId);
  }

  public getEditedHistory(
    user: UserDto,
    postId: string,
    getPostEditedHistoryDto: GetPostEditedHistoryDto
  ): Promise<PageDto<PostEditedHistoryDto>> {
    return this._postHistoryService.getEditedHistory(user, postId, getPostEditedHistoryDto);
  }

  public async getUserGroup(groupId: string, userId: string, postId: string): Promise<any> {
    const user = await this._userAppService.findOne(userId);
    const group = await this._groupAppService.findOne(groupId);
    const post = await this._postService.findPost({ postId });
    return {
      group,
      user,
      post,
    };
  }

  public async isSeriesAndTagsValid(
    groupIds: string[],
    seriesIds: string[] = [],
    tagIds: string[] = []
  ): Promise<boolean> {
    const seriesTagErrorData = {
      seriesIds: [],
      tagIds: [],
      seriesNames: [],
      tagNames: [],
    };
    if (seriesIds.length) {
      const seriesGroups = await this._postService.getListWithGroupsByIds(seriesIds, true);
      const invalidSeries = [];
      seriesGroups.forEach((item) => {
        const isValid = item.groups.some((group) => groupIds.includes(group.groupId));
        if (!isValid) {
          invalidSeries.push(item);
        }
      });
      if (invalidSeries.length) {
        invalidSeries.forEach((e) => {
          seriesTagErrorData.seriesIds.push(e.id);
          seriesTagErrorData.seriesNames.push(e.title);
        });
      }
    }
    if (tagIds.length) {
      const invalidTags = await this._tagService.getInvalidTagsByAudience(tagIds, groupIds);
      if (invalidTags.length) {
        invalidTags.forEach((e) => {
          seriesTagErrorData.tagIds.push(e.id);
          seriesTagErrorData.tagNames.push(e.name);
        });
      }
    }
    if (seriesTagErrorData.seriesIds.length || seriesTagErrorData.tagIds.length) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.APP_POST_AS_READ_INVALID_PARAMETER,
        message: 'Invalid series, tags',
        errors: seriesTagErrorData,
      });
    }
    return true;
  }

  private async _preCheck(post: PostResponseDto, user: UserDto): Promise<void> {
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

    await this.isSeriesAndTagsValid(
      audience.groups.map((e) => e.id),
      post.series.map((item) => item.id),
      post.tags.map((e) => e.id)
    );

    this._postService.checkContent(post.content, post.media);
  }

  public async pinContent(payload: {
    postId: string;
    pinGroupIds: string[];
    unpinGroupIds: string[];
    authUser: UserDto;
  }): Promise<void> {
    const { postId, pinGroupIds, unpinGroupIds, authUser } = payload;
    const post = await this.postModel.findOne({
      attributes: ['id'],
      include: [
        {
          model: PostGroupModel,
          as: 'groups',
          required: true,
          attributes: ['groupId', 'isPinned', 'pinnedIndex'],
          where: { isArchived: false },
        },
      ],
      where: {
        id: postId,
        isHidden: false,
      },
    });

    if (!post || post.groups?.length === 0) {
      throw new ContentNotFoundException();
    }
    const groups = post.groups || [];
    const currentGroupIds = [];
    const currentPinGroupIds = [];
    const currentUnpinGroupIds = [];
    for (const group of groups) {
      if (group.isPinned) currentPinGroupIds.push(group.groupId);
      if (!group.isPinned) currentUnpinGroupIds.push(group.groupId);
      currentGroupIds.push(group.groupId);
    }

    const newGroupIdsPinAndUnpin = [...unpinGroupIds, ...pinGroupIds];

    const groupIdsNotBelong = newGroupIdsPinAndUnpin.filter(
      (groupId) => !currentGroupIds.includes(groupId)
    );
    if (groupIdsNotBelong.length) {
      throw new AudienceNoBelongContentException({ groupsDenied: groupIdsNotBelong });
    }
    await this._authorityService.checkPinPermission(authUser, newGroupIdsPinAndUnpin);

    const addPinGroupIds = pinGroupIds.filter((groupId) => !currentPinGroupIds.includes(groupId));
    const addUnpinGroupIds = unpinGroupIds.filter(
      (groupId) => !currentUnpinGroupIds.includes(groupId)
    );
    try {
      await this._postService.unpinPostToGroupIds(postId, addUnpinGroupIds);
      await this._postService.pinPostToGroupIds(postId, addPinGroupIds);
    } catch (ex) {
      this._logger.error(JSON.stringify(ex?.stack));
    }
  }

  public async reorderPinnedContent(payload: {
    groupId: string;
    postIds: string[];
    authUser: UserDto;
  }): Promise<void> {
    const { groupId, postIds, authUser } = payload;

    await this._authorityService.checkPinPermission(authUser, [groupId]);

    const postGroups = await this._postService.getPinnedPostGroupsByGroupId(groupId);
    const currentPostIds = postGroups.map((e) => e.postId);
    const postIdsNotBelong = postIds.filter((postId) => !currentPostIds.includes(postId));
    if (postIdsNotBelong.length) {
      throw new ContentPinNotFoundException({ postsDenied: postIdsNotBelong });
    }
    const postsIdsNotFound = currentPostIds.filter((postId) => !postIds.includes(postId));
    if (postsIdsNotFound.length) {
      throw new ContentPinLackException({ postsLacked: postsIdsNotFound });
    }

    try {
      await this._postService.reorderPinnedPostGroups(groupId, postIds);
    } catch (ex) {
      this._logger.error(JSON.stringify(ex?.stack));
    }
  }
}
