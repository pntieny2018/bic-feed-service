import { uniq } from 'lodash';
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
import { PostGroupModel } from '../../../database/models/post-group.model';
import { PostModel, PostStatus } from '../../../database/models/post.model';
import { PostHasBeenDeletedEvent } from '../../../events/post';
import { AuthorityService } from '../../authority';
import { GetPostEditedHistoryDto, SearchPostsDto } from '../dto/requests';
import { GetDraftPostDto } from '../dto/requests/get-draft-posts.dto';
import { PostEditedHistoryDto } from '../dto/responses';
import { PostHistoryService } from '../post-history.service';
import { PostService } from '../post.service';
import { TagService } from '../../tag/tag.service';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../v2-user/application';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../v2-group/application';
import { ContentNotFoundException } from '../../v2-post/domain/exception/content-not-found.exception';
import { GetAudienceContentDto } from '../dto/requests/get-audience-content.response.dto';
import { AudienceNoBelongContentException } from '../../v2-post/domain/exception/audience-no-belong-content.exception';
import { InjectModel } from '@nestjs/sequelize';
import { ContentPinNotFoundException } from '../../v2-post/domain/exception/content-pin-not-found.exception';
import { ContentPinLackException } from '../../v2-post/domain/exception/content-pin-lack.exception';
import { ArticleResponseDto } from '../../article/dto/responses';
import { RULES } from '../../v2-post/constant';
import { PostLimitAttachedSeriesException } from '../../v2-post/domain/exception';
import { TargetType } from '../../report-content/contstants';
import { SearchService } from '../../search/search.service';
import { IPostElasticsearch } from '../../search/interfaces';
import { PostBindingService } from '../post-binding.service';

@Injectable()
export class PostAppService {
  private _logger = new Logger(PostAppService.name);

  public constructor(
    private _postService: PostService,
    private _searchService: SearchService,
    private _postBindingService: PostBindingService,
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
    protected postModel: typeof PostModel
  ) {}

  public getDraftPosts(
    user: UserDto,
    getDraftPostDto: GetDraftPostDto
  ): Promise<PageDto<ArticleResponseDto>> {
    return this._postService.getDrafts(user.id, getDraftPostDto);
  }

  public async getTotalDraft(user: UserDto): Promise<any> {
    return this._postService.getTotalDraft(user);
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

  public async validateUpdateSeriesData(postId: string, series: string[]): Promise<void> {
    if (series && series.length > RULES.LIMIT_ATTACHED_SERIES) {
      throw new PostLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }

    const post = (await this._postService.getPostsWithSeries([postId], true))[0];
    const seriesIds = post.postSeries.map((item) => item.seriesId);
    const isOverLimtedToAttachSeries =
      uniq([...series, ...seriesIds]).length > RULES.LIMIT_ATTACHED_SERIES;

    if (isOverLimtedToAttachSeries) {
      throw new PostLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }
  }

  /*
    Search posts, articles, series
  */
  public async searchPosts(
    authUser: UserDto,
    searchPostsDto: SearchPostsDto
  ): Promise<PageDto<any>> {
    const { contentSearch, limit, offset, groupId, tagName } = searchPostsDto;
    if (!authUser || authUser.groups.length === 0) {
      return new PageDto<any>([], {
        total: 0,
        limit,
        offset,
      });
    }

    let groupIds = authUser.groups;
    let tagId: string;
    if (groupId) {
      const group = await this._groupAppService.findOne(groupId);
      if (!group) {
        throw new BadRequestException(`Group not found`);
      }
      groupIds = this._groupAppService.getGroupIdAndChildIdsUserJoined(group, authUser.groups);
      if (groupIds.length === 0) {
        return new PageDto<any>([], {
          limit,
          offset,
          hasNextPage: false,
        });
      }
      if (tagName) {
        tagId = await this._tagService.findTag(tagName, groupId);
        if (tagId) {
          searchPostsDto.tagId = tagId;
        }
      }
    }

    const notIncludeIds = await this._postService.getEntityIdsReportedByUser(authUser.id, [
      TargetType.POST,
    ]);
    searchPostsDto.notIncludeIds = notIncludeIds;

    const payload = await this._searchService.getPayloadSearchForPost(searchPostsDto, groupIds);
    const response = await this._searchService.search<IPostElasticsearch>(payload);
    const hits = response.hits.hits;
    const itemIds = [];
    const attrUserIds = [];
    const attrGroupIds = [];
    const posts = hits.map((item) => {
      const { _source: source } = item;
      if (source.items && source.items.length) {
        itemIds.push(...source.items.map((item) => item.id));
      }
      attrUserIds.push(source.createdBy);
      if (source.mentionUserIds) attrUserIds.push(...source.mentionUserIds);
      attrGroupIds.push(...source.groupIds);
      attrGroupIds.push(...source.communityIds);
      const data: any = {
        id: source.id,
        groupIds: source.groupIds,
        communityIds: source.communityIds,
        mentionUserIds: source.mentionUserIds,
        type: source.type,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
        createdBy: source.createdBy,
        publishedAt: source.publishedAt,
        coverMedia: source.coverMedia ?? null,
        media: source.media || {
          files: [],
          images: [],
          videos: [],
        },
        content: source.content || null,
        title: source.title || null,
        summary: source.summary || null,
        categories: source.categories || [],
        items: source.items || [],
        tags: source.tags || [],
      };

      if (contentSearch && item.highlight && item.highlight['content']?.length && source.content) {
        data.highlight = item.highlight['content'][0];
      }

      if (contentSearch && item.highlight && item.highlight['title']?.length && source.title) {
        data.titleHighlight = item.highlight['title'][0];
      }

      if (contentSearch && item.highlight && item.highlight['summary']?.length && source.summary) {
        data.summaryHighlight = item.highlight['summary'][0];
      }
      return data;
    });

    await Promise.all([
      this._postBindingService.bindRelatedData(posts, {
        shouldBindActor: true,
        shouldBindAudience: true,
        shouldBindCommnunity: true,
        shouldHideSecretAudienceCanNotAccess: true,
        shouldBindMention: true,
        shouldBindReaction: true,
        shouldBindQuiz: true,
        shouldBindSeriesItems: true,
        authUser,
      }),
      this._postBindingService.bindAttributes(posts, [
        'content',
        'commentsCount',
        'totalUsersSeen',
        'setting',
        'wordCount',
      ]),
    ]);

    return new PageDto<any>(posts, {
      total: response.hits.total['value'],
      limit,
      offset,
    });
  }
}
