import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { PostModel } from '../../database/models/post.model';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { CommentService } from '../comment';
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
    protected readonly sentryService: SentryService
  ) {}

  /**
   * Bind Audience To Post.Groups
   * @param posts Array of post
   * @returns Promise resolve void
   * @throws HttpException
   */

  public async bindRelatedData(
    posts: any[],
    {
      shouldHideSecretAudienceCanNotAccess,
      authUser,
    }: { shouldHideSecretAudienceCanNotAccess: boolean; authUser: UserDto }
  ): Promise<PostResponseDto[]> {
    await Promise.all([
      this.reactionService.bindToPosts(posts),
      this.mentionService.bindMentionsToPosts(posts),
      this.bindActorToPost(posts),
      this.bindAudienceToPost(posts, { shouldHideSecretAudienceCanNotAccess, authUser }),
    ]);
    const result = this.classTransformer.plainToInstance(PostResponseDto, posts, {
      excludeExtraneousValues: true,
    });
    return result;
  }

  public async bindAudienceToPost(
    posts: any[],
    options?: {
      shouldHideSecretAudienceCanNotAccess?: boolean;
      authUser?: UserDto;
    }
  ): Promise<void> {
    const { shouldHideSecretAudienceCanNotAccess, authUser } = options;
    //get all groups in onetime
    const dataGroups = await this._getGroupsByPosts(posts);
    for (const post of posts) {
      const postGroupIds = this._getGroupIdsByPost(post);
      const mappedGroups = dataGroups
        .filter((dataGroup) => {
          const isPostOutOfScope = !postGroupIds.includes(dataGroup.id);
          if (isPostOutOfScope) return false;

          const isUserNotInGroup = !authUser.profile.groups.includes(dataGroup.id);
          const isGuest = !authUser;
          if (
            shouldHideSecretAudienceCanNotAccess &&
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
   * @param posts Array of post
   * @returns Promise resolve void
   * @throws HttpException
   */
  public async bindActorToPost(posts: any[]): Promise<void> {
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
   * @param posts Array of post
   * @param objects {commentsCount: boolean, totalUsersSeen: boolean}
   * @returns Promise resolve void
   * @throws HttpException
   */
  public async bindPostData(
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
