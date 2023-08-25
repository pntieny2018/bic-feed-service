import { SentryService } from '@libs/infra/sentry';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import { Sequelize } from 'sequelize-typescript';

import { ArrayHelper } from '../../common/helpers';
import { PostModel } from '../../database/models/post.model';
import { LinkPreviewService } from '../link-preview/link-preview.service';
import { MentionService } from '../mention';
import { ReactionService } from '../reaction';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../v2-group/application';
import { GroupPrivacy } from '../v2-group/data-type';
import { IUserApplicationService, USER_APPLICATION_TOKEN, UserDto } from '../v2-user/application';

import { PostResponseDto } from './dto/responses';

@Injectable()
export class PostBindingService {
  /**
   * Logger
   * @protected
   */
  protected logger = new Logger(PostBindingService.name);

  /**
   *  ClassTransformer
   * @protected
   */
  protected classTransformer = new ClassTransformer();

  public constructor(
    @InjectConnection()
    protected sequelizeConnection: Sequelize,
    @InjectModel(PostModel)
    protected postModel: typeof PostModel,
    @Inject(USER_APPLICATION_TOKEN)
    protected userAppService: IUserApplicationService,
    @Inject(GROUP_APPLICATION_TOKEN)
    protected groupAppService: IGroupApplicationService,
    protected reactionService: ReactionService,
    protected mentionService: MentionService,
    protected linkPreviewService: LinkPreviewService,
    protected readonly sentryService: SentryService
  ) {}

  /**
   * Bind Audience To Post.Groups
   */

  public async bindRelatedData(
    posts: any[],
    options?: {
      shouldBindActor?: boolean;
      shouldBindMention?: boolean;
      shouldBindAudience?: boolean;
      shouldBindReaction?: boolean;
      shouldBindAudienceReported?: boolean;
      shouldHideSecretAudienceCanNotAccess?: boolean;
      authUser?: UserDto;
    }
  ): Promise<PostResponseDto[]> {
    if (posts.length === 0) {
      return [];
    }
    const processList = [];
    if (options?.shouldBindActor) {
      processList.push(this.bindActor(posts));
    }
    if (options?.shouldBindMention) {
      processList.push(this.mentionService.bindToPosts(posts));
    }
    if (options?.shouldBindAudienceReported) {
      processList.push(this.bindAudienceReported(posts));
    }
    if (options?.shouldBindAudience) {
      processList.push(
        this.bindAudience(posts, {
          shouldHideSecretAudienceCanNotAccess:
            options?.shouldHideSecretAudienceCanNotAccess ?? false,
          authUser: options?.authUser ?? null,
        })
      );
    }
    if (options?.shouldBindReaction) {
      processList.push(this.reactionService.bindToPosts(posts));
    }
    if (processList.length === 0) {
      return [];
    }
    await Promise.all(processList);
    return posts;
  }

  public async bindAudienceReported(posts: any[]): Promise<void> {
    //get all groups in onetime
    const dataGroups = await this._getGroupsByPosts(posts);
    for (const post of posts) {
      const audiences = post.groups.map((group) => {
        const { isReported, groupId } = group;
        const groupInfo = dataGroups.find((g) => g.id === groupId);
        delete groupInfo?.child;
        return { ...groupInfo, isReported: isReported ?? false };
      });
      post.audience = { groups: audiences };
    }
  }

  public async bindAudience(
    posts: any[],
    options?: {
      shouldHideSecretAudienceCanNotAccess?: boolean;
      authUser?: UserDto;
    }
  ): Promise<void> {
    //get all groups in onetime
    const dataGroups = await this._getGroupsByPosts(posts);
    for (const post of posts) {
      const postGroupIds = this._getGroupIdsByPost(post);
      const mappedGroups = dataGroups
        .filter((dataGroup) => {
          const isPostOutOfScope = !postGroupIds.includes(dataGroup.id);
          if (isPostOutOfScope) {
            return false;
          }

          const isUserNotInGroup = !options?.authUser?.groups.includes(dataGroup.id);
          const isGuest = !options?.authUser;
          if (
            options?.shouldHideSecretAudienceCanNotAccess &&
            dataGroup.privacy === GroupPrivacy.SECRET &&
            (isUserNotInGroup || isGuest)
          ) {
            return false;
          }
          return true;
        })
        //remote child
        .map((dataGroup) => {
          delete dataGroup.child;
          return dataGroup;
        });
      post.audience = { groups: mappedGroups };
    }
  }

  public async bindCommunity(posts: any[]): Promise<void> {
    const communities = await this._getCommunitiesByPosts(posts);
    if (communities.length) {
      for (const post of posts) {
        const postCommunityIds = this._getRootGroupIdsByGroups(post.audience.groups);
        post.communities = communities.filter((community) =>
          postCommunityIds.includes(community.id)
        );
      }
    }
  }

  private _getGroupIdsByPost(post: any): string[] {
    if (post.groupIds) {
      return post.groupIds;
    }
    let postGroups = post.groups;
    if (post.audience?.groups) {
      postGroups = post.audience?.groups;
    } //bind for elasticsearch
    if (postGroups && postGroups.length) {
      return postGroups.map((postGroup) => {
        if (postGroup.id) {
          return postGroup.id;
        }
        return postGroup.groupId;
      });
    }

    return [];
  }

  private async _getGroupsByPosts(posts: any[]): Promise<GroupDto[]> {
    const groupIds = [];
    const groupIdsExising = new Set([]);
    const groups = [];
    for (const post of posts) {
      if (post.groupIds) {
        for (const groupId of post.groupIds) {
          if (!groupIdsExising.has(groupId)) {
            groupIdsExising.add(groupId);
            groups.push();
          }
        }
        groupIds.push(...post.groupIds);
      }
      if (post.groups && post.groups.length) {
        groupIds.push(...post.groups.map((m) => m.groupId || m.id));
      }
    }
    return this.groupAppService.findAllByIds(groupIds);
  }

  private async _getCommunitiesByPosts(
    posts: any[]
  ): Promise<Pick<GroupDto, 'id' | 'icon' | 'name' | 'privacy'>[]> {
    const rootGroupIds = [];
    for (const post of posts) {
      let groups = [];
      if (post.audience?.groups) {
        groups = post.audience?.groups;
      } //bind for elasticsearch

      rootGroupIds.push(...this._getRootGroupIdsByGroups(groups));
    }
    const communities = await this.groupAppService.findAllByIds(
      ArrayHelper.arrayUnique(rootGroupIds)
    );
    return communities.map((community) => ({
      id: community.id,
      icon: community.icon,
      name: community.name,
      privacy: community.privacy,
      communityId: community.communityId,
    }));
  }

  private _getRootGroupIdsByGroups(groups: GroupDto[]): string[] {
    const rootGroupIds = [];
    for (const group of groups) {
      if (!rootGroupIds.includes(group.rootGroupId)) {
        rootGroupIds.push(group.rootGroupId);
      }
    }
    return rootGroupIds;
  }

  /**
   * Bind Actor info to post.createdBy
   */
  public async bindActor(posts: any[]): Promise<void> {
    const userIds = [];
    for (const post of posts) {
      userIds.push(post.createdBy);
      if (post.articles?.length) {
        userIds.push(...post.articles.map((article) => article.createdBy));
      }
    }
    const users = await this.userAppService.findAllByIds(userIds);
    for (const post of posts) {
      post.actor = users.find((i) => i.id === post.createdBy);
      if (post.articles?.length) {
        post.articles = post.articles.map((article) => {
          if (article.createdBy) {
            article.actor = users.find((i) => i.id === article.createdBy);
            return article;
          }
          return article;
        });
      }
    }
  }

  /**
   * Bind data info to post
   */
  public async bindAttributes(
    posts: any[],
    attributes: Array<'content' | 'commentsCount' | 'totalUsersSeen' | 'setting' | 'wordCount'>
  ): Promise<void> {
    const postIds = [];
    for (const post of posts) {
      postIds.push(post.id);
    }
    const result = await this.postModel.findAll({
      raw: true,
      where: { id: postIds },
    });
    for (const post of posts) {
      const findPost = result.find((i) => i.id == post.id);
      if (findPost) {
        if (attributes.includes('content')) {
          post.content = findPost?.content || '';
        }
        if (attributes.includes('commentsCount')) {
          post.commentsCount = findPost?.commentsCount || 0;
        }
        if (attributes.includes('wordCount')) {
          post.wordCount = findPost?.wordCount || 0;
        }
        if (attributes.includes('totalUsersSeen')) {
          post.totalUsersSeen = findPost?.totalUsersSeen || 0;
        }
        if (attributes.includes('wordCount')) {
          post.wordCount = findPost?.wordCount || 0;
        }
        if (attributes.includes('setting')) {
          post.setting = {
            importantExpiredAt: findPost.importantExpiredAt,
            isImportant: findPost.isImportant,
            canReact: findPost.canReact,
            canComment: findPost.canComment,
          };
        }
      }
    }
  }
}
