import sequelize from 'sequelize';
import { OrderEnum, PageDto } from '../../common/dto';
import { GetTimelineDto } from './dto/request';
import { Inject, Logger, Injectable, forwardRef, BadRequestException } from '@nestjs/common';
import { MentionService } from '../mention';
import { GroupService } from '../../shared/group';
import { PostService } from '../post/post.service';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';
import { ClassTransformer } from 'class-transformer';
import { PostResponseDto } from '../post/dto/responses';
import { getDatabaseConfig } from '../../config/database';
import { PostModel } from '../../database/models/post.model';
import { MediaModel } from '../../database/models/media.model';
import { GetNewsFeedDto } from './dto/request/get-newsfeed.dto';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { MentionModel } from '../../database/models/mention.model';
import { PostGroupModel } from '../../database/models/post-group.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { PostMediaModel } from '../../database/models/post-media.model';
import { CommonReactionService } from '../reaction/services';
import { UserDto } from '../auth';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';

@Injectable()
export class FeedService {
  private readonly _logger = new Logger(FeedService.name);
  private _classTransformer = new ClassTransformer();

  public constructor(
    private readonly _commonReaction: CommonReactionService,
    private readonly _groupService: GroupService,
    private readonly _mentionService: MentionService,
    @Inject(forwardRef(() => PostService))
    private readonly _postService: PostService,
    @InjectModel(UserNewsFeedModel)
    private _newsFeedModel: typeof UserNewsFeedModel,
    @InjectModel(PostModel) private readonly _postModel: typeof PostModel,
    @InjectConnection()
    private _sequelizeConnection: Sequelize
  ) {}

  /**
   * Get NewsFeed
   * @param authUser number
   * @param getNewsFeedDto GetNewsFeedDto
   * @returns Promise resolve PageDto
   * @throws HttpException
   */
  public async getNewsFeed(authUser: UserDto, getNewsFeedDto: GetNewsFeedDto): Promise<any> {
    const { limit, offset } = getNewsFeedDto;
    try {
      const authUserId = authUser.id;
      const constraints = FeedService._getIdConstrains(getNewsFeedDto);
      const totalImportantPosts = await this._postService.getTotalImportantPostInNewsFeed(
        authUserId,
        constraints
      );
      let importantPostsExc = Promise.resolve([]);
      if (offset < totalImportantPosts) {
        importantPostsExc = this._getNewsFeedData({
          ...getNewsFeedDto,
          limit: limit + 1,
          authUserId,
          isImportant: true,
        });
      }

      let normalPostsExc = Promise.resolve([]);
      if (offset + limit >= totalImportantPosts) {
        normalPostsExc = this._getNewsFeedData({
          ...getNewsFeedDto,
          offset: Math.max(0, offset - totalImportantPosts),
          limit: Math.min(limit + 1, limit + offset - totalImportantPosts + 1),
          authUserId,
          isImportant: false,
        });
      }
      const [importantPosts, normalPosts] = await Promise.all([importantPostsExc, normalPostsExc]);
      const rows = importantPosts.concat(normalPosts);
      const posts = this.groupPosts(rows);

      const hasNextPage = posts.length === limit + 1 ? true : false;
      if (hasNextPage) posts.pop();

      await Promise.all([
        this._commonReaction.bindReactionToPosts(posts),
        this._mentionService.bindMentionsToPosts(posts),
        this._postService.bindActorToPost(posts),
        this._postService.bindAudienceToPost(posts),
      ]);
      const result = this._classTransformer.plainToInstance(PostResponseDto, posts, {
        excludeExtraneousValues: true,
      });
      return new PageDto<PostResponseDto>(result, {
        limit,
        offset,
        hasNextPage,
      });
    } catch (e) {
      this._logger.error(e, e.stack);
      return new PageDto<PostResponseDto>([], {
        limit,
        offset,
        hasNextPage: false,
      });
    }
  }

  /**
   * Get Timeline
   * @param authUser UserDto
   * @param getTimelineDto GetTimelineDto
   * @returns Promise resolve PageDto
   * @throws HttpException
   */
  public async getTimeline(authUser: UserDto, getTimelineDto: GetTimelineDto): Promise<any> {
    const { limit, offset, groupId } = getTimelineDto;
    const group = await this._groupService.get(groupId);
    if (!group) {
      throw new BadRequestException(`Group ${groupId} not found`);
    }
    const groupIds = [groupId, ...group.child].filter((groupId) =>
      authUser.profile.groups.includes(groupId)
    );
    if (groupIds.length === 0) {
      return new PageDto<PostResponseDto>([], {
        limit,
        offset,
        hasNextPage: false,
      });
    }
    const authUserId = authUser.id;
    const constraints = FeedService._getIdConstrains(getTimelineDto);

    const totalImportantPosts = await this._postService.getTotalImportantPostInGroups(
      authUserId,
      groupIds,
      constraints
    );
    let importantPostsExc = Promise.resolve([]);
    if (offset < totalImportantPosts) {
      importantPostsExc = this._getTimelineData({
        ...getTimelineDto,
        limit: limit + 1,
        groupIds,
        authUser,
        isImportant: true,
      });
    }
    let normalPostsExc = Promise.resolve([]);
    if (offset + limit >= totalImportantPosts) {
      normalPostsExc = this._getTimelineData({
        ...getTimelineDto,
        offset: Math.max(0, offset - totalImportantPosts),
        limit: Math.min(limit + 1, limit + offset - totalImportantPosts + 1),
        groupIds,
        authUser,
        isImportant: false,
      });
    }
    const [importantPosts, normalPosts] = await Promise.all([importantPostsExc, normalPostsExc]);
    const rows = importantPosts.concat(normalPosts);
    const posts = this.groupPosts(rows);
    const hasNextPage = posts.length === limit + 1 ? true : false;
    if (hasNextPage) posts.pop();
    await Promise.all([
      this._commonReaction.bindReactionToPosts(posts),
      this._mentionService.bindMentionsToPosts(posts),
      this._postService.bindActorToPost(posts),
      this._postService.bindAudienceToPost(posts),
    ]);
    const result = this._classTransformer.plainToInstance(PostResponseDto, posts, {
      excludeExtraneousValues: true,
    });

    return new PageDto<PostResponseDto>(result, {
      limit,
      offset,
      hasNextPage,
    });
  }

  /**
   * Get id constrains
   * @param getTimelineDto GetTimelineDto
   * @returns object
   */
  private static _getIdConstrains(getTimelineDto: GetTimelineDto | GetNewsFeedDto): string {
    let constraints = '';
    if (getTimelineDto.idGT) {
      constraints += 'AND p.id > :idGT';
    }
    if (getTimelineDto.idGTE) {
      constraints += 'AND p.id >= :idGTE';
    }
    if (getTimelineDto.idLT) {
      constraints += 'AND p.id < :idLT';
    }
    if (getTimelineDto.idLTE) {
      constraints += 'AND p.id <= :idLTE';
    }
    return constraints;
  }

  /**
   * Delete newsfeed by post
   * @param postId number
   * @param transaction Transaction
   * @returns object
   */
  public async deleteNewsFeedByPost(postId: number, transaction: Transaction): Promise<number> {
    return await this._newsFeedModel.destroy({ where: { postId }, transaction: transaction });
  }

  public groupPosts(posts: any[]): any[] {
    const result = [];
    posts.forEach((post) => {
      const {
        id,
        commentsCount,
        isImportant,
        importantExpiredAt,
        isDraft,
        content,
        canComment,
        canReact,
        canShare,
        createdBy,
        updatedBy,
        createdAt,
        updatedAt,
        isNowImportant,
      } = post;
      const postAdded = result.find((i) => i.id === post.id);
      if (!postAdded) {
        const groups = post.groupId === null ? [] : [{ groupId: post.groupId }];
        const mentions = post.userId === null ? [] : [{ userId: post.userId }];
        const ownerReactions =
          post.postReactionId === null
            ? []
            : [
                {
                  id: post.postReactionId,
                  reactionName: post.reactionName,
                  createdAt: post.reactCreatedAt,
                },
              ];
        const media =
          post.mediaId === null
            ? []
            : [
                {
                  id: post.mediaId,
                  url: post.url,
                  name: post.name,
                  type: post.type,
                  width: post.width,
                  height: post.height,
                  extension: post.extension,
                },
              ];
        result.push({
          id,
          commentsCount,
          isImportant,
          importantExpiredAt,
          isDraft,
          content,
          canComment,
          canReact,
          canShare,
          createdBy,
          updatedBy,
          createdAt,
          updatedAt,
          isNowImportant,
          groups,
          mentions,
          media,
          ownerReactions,
        });
        return;
      }
      if (post.groupId !== null && !postAdded.groups.find((g) => g.groupId === post.groupId)) {
        postAdded.groups.push({ groupId: post.groupId });
      }
      if (post.userId !== null && !postAdded.mentions.find((m) => m.userId === post.userId)) {
        postAdded.mentions.push({ userId: post.userId });
      }
      if (
        post.postReactionId !== null &&
        !postAdded.ownerReactions.find((m) => m.id === post.postReactionId)
      ) {
        postAdded.ownerReactions.push({
          id: post.postReactionId,
          reactionName: post.reactionName,
          createdAt: post.reactCreatedAt,
        });
      }
      if (post.mediaId !== null && !postAdded.media.find((m) => m.id === post.mediaId)) {
        postAdded.media.push({
          id: post.mediaId,
          url: post.url,
          name: post.name,
          width: post.width,
          height: post.height,
          extension: post.extension,
        });
      }
    });
    return result;
  }

  private async _getTimelineData({
    authUser,
    groupIds,
    isImportant,
    idGT,
    idGTE,
    idLT,
    idLTE,
    offset,
    limit,
    order,
  }: {
    authUser: UserDto;
    groupIds: number[];
    isImportant: boolean;
    idGT?: number;
    idGTE?: any;
    idLT?: any;
    idLTE?: any;
    offset?: number;
    limit?: number;
    order?: OrderEnum;
  }): Promise<any[]> {
    let condition = FeedService._getIdConstrains({ idGT, idGTE, idLT, idLTE });
    const { schema } = getDatabaseConfig();
    const postTable = PostModel.tableName;
    const postGroupTable = PostGroupModel.tableName;
    const mentionTable = MentionModel.tableName;
    const postReactionTable = PostReactionModel.tableName;
    const mediaTable = MediaModel.tableName;
    const postMediaTable = PostMediaModel.tableName;
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;

    const authUserId = authUser.id;
    if (isImportant) {
      condition += `AND "p"."is_important" = true AND "p"."important_expired_at" > NOW() AND NOT EXISTS (
        SELECT 1
        FROM ${schema}.${userMarkReadPostTable} as u
        WHERE u.user_id = 15 AND u.post_id = p.id
      )`;
    } else {
      condition += `AND "p"."is_important" = false`;
    }
    const query = `SELECT 
    "PostModel".*,
    "groups"."group_id" as "groupId",
    "mentions"."user_id" as "userId",
    "ownerReactions"."reaction_name" as "reactionName",
    "ownerReactions"."id" as "postReactionId",
    "ownerReactions"."created_at" as "reactCreatedAt",
    "media"."id" as "mediaId",
    "media"."url",
    "media"."name",
    "media"."type",
    "media"."width",
    "media"."height",
    "media"."extension"
    FROM (
      SELECT 
      "p"."id", 
      "p"."comments_count" AS "commentsCount",
      "p"."is_important" AS "isImportant", 
      "p"."important_expired_at" AS "importantExpiredAt", "p"."is_draft" AS "isDraft", 
      "p"."can_comment" AS "canComment", "p"."can_react" AS "canReact", "p"."can_share" AS "canShare", 
      "p"."content", "p"."created_by" AS "createdBy", "p"."updated_by" AS "updatedBy", "p"."created_at" AS 
      "createdAt", "p"."updated_at" AS "updatedAt"
      FROM ${schema}.${postTable} AS "p"
      WHERE "p"."is_draft" = false AND EXISTS(
        SELECT 1
        from ${schema}.${postGroupTable} AS g
        WHERE g.post_id = p.id
        AND g.group_id IN(:groupIds)
      ) ${condition}
      ORDER BY "p"."created_at" ${order}
      OFFSET :offset LIMIT :limit
    ) AS "PostModel"
      LEFT JOIN ${schema}.${postGroupTable} AS "groups" ON "PostModel"."id" = "groups"."post_id"
      LEFT OUTER JOIN ( 
        ${schema}.${postMediaTable} AS "media->PostMediaModel" 
        INNER JOIN ${schema}.${mediaTable} AS "media" ON "media"."id" = "media->PostMediaModel"."media_id"
      ) ON "PostModel"."id" = "media->PostMediaModel"."post_id" 
      LEFT OUTER JOIN ${schema}.${mentionTable} AS "mentions" ON "PostModel"."id" = "mentions"."entity_id" AND "mentions"."mentionable_type" = 'post' 
      LEFT OUTER JOIN ${schema}.${postReactionTable} AS "ownerReactions" ON "PostModel"."id" = "ownerReactions"."post_id" AND "ownerReactions"."created_by" = :authUserId
      ORDER BY "PostModel"."createdAt" ${order}`;
    const rows: any[] = await this._sequelizeConnection.query(query, {
      replacements: {
        groupIds,
        offset,
        limit: limit,
        authUserId,
        idGT,
        idGTE,
        idLT,
        idLTE,
      },
      type: QueryTypes.SELECT,
    });

    return rows;
  }

  private async _getNewsFeedData({
    authUserId,
    isImportant,
    idGT,
    idGTE,
    idLT,
    idLTE,
    offset,
    limit,
    order,
  }: {
    authUserId: number;
    isImportant: boolean;
    idGT?: number;
    idGTE?: any;
    idLT?: any;
    idLTE?: any;
    offset?: number;
    limit?: number;
    order?: OrderEnum;
  }): Promise<any[]> {
    let condition = FeedService._getIdConstrains({ idGT, idGTE, idLT, idLTE });
    const { schema } = getDatabaseConfig();
    const postTable = PostModel.tableName;
    const userNewsFeedModel = UserNewsFeedModel.tableName;
    const mentionTable = MentionModel.tableName;
    const postReactionTable = PostReactionModel.tableName;
    const mediaTable = MediaModel.tableName;
    const postMediaTable = PostMediaModel.tableName;
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;
    const postGroupTable = PostGroupModel.tableName;
    if (isImportant) {
      condition += `AND "p"."is_important" = true AND "p"."important_expired_at" > NOW() AND NOT EXISTS (
        SELECT 1
        FROM ${schema}.${userMarkReadPostTable} as u
        WHERE u.user_id = 15 AND u.post_id = p.id
      )`;
    } else {
      condition += `AND "p"."is_important" = false`;
    }
    const query = `SELECT 
    "PostModel".*,
    "groups"."group_id" as "groupId",
    "mentions"."user_id" as "userId",
    "ownerReactions"."reaction_name" as "reactionName",
    "ownerReactions"."id" as "postReactionId",
    "ownerReactions"."created_at" as "reactCreatedAt",
    "media"."id" as "mediaId",
    "media"."url",
    "media"."name",
    "media"."type",
    "media"."width",
    "media"."height",
    "media"."extension"
    FROM (
      SELECT 
      "p"."id", 
      "p"."comments_count" AS "commentsCount",
      "p"."is_important" AS "isImportant", 
      "p"."important_expired_at" AS "importantExpiredAt", "p"."is_draft" AS "isDraft", 
      "p"."can_comment" AS "canComment", "p"."can_react" AS "canReact", "p"."can_share" AS "canShare", 
      "p"."content", "p"."created_by" AS "createdBy", "p"."updated_by" AS "updatedBy", "p"."created_at" AS 
      "createdAt", "p"."updated_at" AS "updatedAt"
      FROM ${schema}.${postTable} AS "p"
      WHERE "p"."is_draft" = false AND EXISTS(
        SELECT 1
        from ${schema}.${userNewsFeedModel} AS u
        WHERE u.post_id = p.id
        AND u.user_id  = :authUserId
      ) ${condition}
      ORDER BY "p"."created_at" ${order}
      OFFSET :offset LIMIT :limit
    ) AS "PostModel"
      LEFT JOIN ${schema}.${postGroupTable} AS "groups" ON "PostModel"."id" = "groups"."post_id"
      LEFT OUTER JOIN ( 
        ${schema}.${postMediaTable} AS "media->PostMediaModel" 
        INNER JOIN ${schema}.${mediaTable} AS "media" ON "media"."id" = "media->PostMediaModel"."media_id"
      ) ON "PostModel"."id" = "media->PostMediaModel"."post_id" 
      LEFT OUTER JOIN ${schema}.${mentionTable} AS "mentions" ON "PostModel"."id" = "mentions"."entity_id" AND "mentions"."mentionable_type" = 'post' 
      LEFT OUTER JOIN ${schema}.${postReactionTable} AS "ownerReactions" ON "PostModel"."id" = "ownerReactions"."post_id" AND "ownerReactions"."created_by" = :authUserId
      ORDER BY "PostModel"."createdAt" ${order}
      `;
    const rows: any[] = await this._sequelizeConnection.query(query, {
      replacements: {
        offset,
        limit: limit,
        authUserId,
        idGT,
        idGTE,
        idLT,
        idLTE,
      },
      type: QueryTypes.SELECT,
    });

    return rows;
  }
}
