import { GROUP_SERVICE_TOKEN, IGroupService } from '@libs/service/group';
import { UserDto } from '@libs/service/user';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { uniq } from 'lodash';

import { PageDto } from '../../../common/dto';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { PostModel } from '../../../database/models/post.model';
import { ArticleResponseDto } from '../../article/dto/responses';
import { AuthorityService } from '../../authority';
import { TagService } from '../../tag/tag.service';
import { RULES } from '../../v2-post/constant';
import {
  AudienceNoBelongContentException,
  ContentLimitAttachedSeriesException,
  ContentNotFoundException,
  ContentPinLackException,
  ContentPinNotFoundException,
  PostInvalidParameterException,
} from '../../v2-post/domain/exception';
import { GetAudienceContentDto } from '../dto/requests/get-audience-content.response.dto';
import { GetDraftPostDto } from '../dto/requests/get-draft-posts.dto';
import { PostService } from '../post.service';

@Injectable()
export class PostAppService {
  private _logger = new Logger(PostAppService.name);

  public constructor(
    private _postService: PostService,
    private _authorityService: AuthorityService,
    @Inject(GROUP_SERVICE_TOKEN)
    private _groupAppService: IGroupService,
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
      throw new PostInvalidParameterException();
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
      if (group.isPinned) {
        currentPinGroupIds.push(group.groupId);
      }
      if (!group.isPinned) {
        currentUnpinGroupIds.push(group.groupId);
      }
      currentGroupIds.push(group.groupId);
    }

    const newGroupIdsPinAndUnpin = [...unpinGroupIds, ...pinGroupIds];

    const groupIdsNotBelong = newGroupIdsPinAndUnpin.filter(
      (groupId) => !currentGroupIds.includes(groupId)
    );
    if (groupIdsNotBelong.length) {
      throw new AudienceNoBelongContentException(null, { groupsDenied: groupIdsNotBelong });
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
      throw new ContentPinNotFoundException(null, { postsDenied: postIdsNotBelong });
    }
    const postsIdsNotFound = currentPostIds.filter((postId) => !postIds.includes(postId));
    if (postsIdsNotFound.length) {
      throw new ContentPinLackException(null, { postsLacked: postsIdsNotFound });
    }

    try {
      await this._postService.reorderPinnedPostGroups(groupId, postIds);
    } catch (ex) {
      this._logger.error(JSON.stringify(ex?.stack));
    }
  }

  public async validateUpdateSeriesData(postId: string, series: string[]): Promise<void> {
    if (series && series.length > RULES.LIMIT_ATTACHED_SERIES) {
      throw new ContentLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }

    const post = (await this._postService.getPostsWithSeries([postId], true))[0];
    const seriesIds = post.postSeries.map((item) => item.seriesId);
    const isOverLimitedToAttachSeries =
      uniq([...series, ...seriesIds]).length > RULES.LIMIT_ATTACHED_SERIES;

    if (isOverLimitedToAttachSeries) {
      throw new ContentLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }
  }
}
