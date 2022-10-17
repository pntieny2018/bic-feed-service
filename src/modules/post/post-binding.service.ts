import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { PostModel } from '../../database/models/post.model';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
import { GroupService } from '../../shared/group';
import { ClassTransformer } from 'class-transformer';
import { SentryService } from '@app/sentry';
import { GroupPrivacy, GroupSharedDto } from '../../shared/group/dto';
import { UserDto } from '../auth';
import { ReactionService } from '../reaction';
import { MentionService } from '../mention';
import { PostResponseDto } from './dto/responses';
import { LinkPreviewService } from '../link-preview/link-preview.service';

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
    protected userService: UserService,
    protected groupService: GroupService,
    @Inject(forwardRef(() => ReactionService))
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
      shouldHideSecretAudienceCanNotAccess?: boolean;
      authUser?: UserDto;
      shouldBindLinkPreview?: boolean;
    }
  ): Promise<PostResponseDto[]> {
    const processList = [];
    if (options?.shouldBindActor) {
      processList.push(this.bindActor(posts));
    }
    if (options?.shouldBindMention) {
      processList.push(this.mentionService.bindToPosts(posts));
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
    if (processList.length === 0) return [];
    await Promise.all(processList);
    return posts;
  }

  protected transform(posts: any[]): PostResponseDto[] {
    return this.classTransformer.plainToInstance(PostResponseDto, posts, {
      excludeExtraneousValues: true,
    });
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
          if (isPostOutOfScope) return false;

          const isUserNotInGroup = !options?.authUser?.profile.groups.includes(dataGroup.id);
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

  private _getGroupIdsByPost(post: any): string[] {
    let postGroups = post.groups;
    if (post.audience?.groups) postGroups = post.audience?.groups; //bind for elasticsearch
    if (postGroups && postGroups.length) {
      return postGroups.map((postGroup) => {
        if (postGroup.id) return postGroup.id;
        return postGroup.groupId;
      });
    }

    return [];
  }

  private async _getGroupsByPosts(posts: any[]): Promise<GroupSharedDto[]> {
    const groupIds = [];
    for (const post of posts) {
      let postGroups = post.groups;
      if (post.audience?.groups) postGroups = post.audience?.groups; //bind for elasticsearch

      if (postGroups && postGroups.length) {
        groupIds.push(...postGroups.map((m) => m.groupId || m.id));
      }
    }
    const dataGroups = await this.groupService.getMany(groupIds);
    return dataGroups;
  }

  /**
   * Bind Actor info to post.createdBy
   */
  public async bindActor(posts: any[]): Promise<void> {
    const userIds = [];
    for (const post of posts) {
      if (post.actor?.id) {
        userIds.push(post.actor.id);
      } else {
        userIds.push(post.createdBy);
      }
    }
    const users = await this.userService.getMany(userIds);
    for (const post of posts) {
      if (post.actor?.id) {
        post.actor = users.find((i) => i.id === post.actor.id);
      } else {
        post.actor = users.find((i) => i.id === post.createdBy);
      }
    }
  }

  /**
   * Bind data info to post
   */
  public async bindAttributes(
    posts: any[],
    attributes: Array<'content' | 'commentsCount' | 'totalUsersSeen' | 'setting'>
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
      if (attributes['content']) post.content = findPost?.content || '';
      if (attributes['commentsCount']) post.commentsCount = findPost?.commentsCount || 0;
      if (attributes['totalUsersSeen']) post.totalUsersSeen = findPost?.totalUsersSeen || 0;
      if (attributes['setting']) {
        post.setting = {
          importantExpiredAt: findPost.importantExpiredAt,
          isImportant: findPost.isImportant,
          canReact: findPost.canReact,
          canShare: findPost.canShare,
          canComment: findPost.canComment,
        };
      }
    }
  }
}
