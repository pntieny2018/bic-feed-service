import { Inject, Logger, Injectable, forwardRef, BadRequestException } from '@nestjs/common';
import { UserDto } from '../auth';
import { PageDto } from '../../common/dto';
import { MentionService } from '../mention';
import { GetTimelineDto } from './dto/request';
import { GroupService } from '../../shared/group';
import { PostService } from '../post/post.service';
import { QueryTypes, Sequelize } from 'sequelize';
import { ClassTransformer } from 'class-transformer';
import { PostResponseDto } from '../post/dto/responses';
import { getDatabaseConfig } from '../../config/database';
import { CommonReactionService } from '../reaction/services';
import { PostModel } from '../../database/models/post.model';
import { MediaModel } from '../../database/models/media.model';
import { GetNewsFeedDto } from './dto/request/get-newsfeed.dto';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { MentionModel } from '../../database/models/mention.model';
import { PostGroupModel } from '../../database/models/post-group.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { PostMediaModel } from '../../database/models/post-media.model';

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
   * @param authUser Number
   * @param getNewsFeedDto GetNewsFeedDto
   * @returns Promise resolve PageDto
   * @throws HttpException
   */
  public async getNewsFeed(authUser: UserDto, getNewsFeedDto: GetNewsFeedDto): Promise<any> {
    const { limit, offset, order } = getNewsFeedDto;
    try {
      const groupIds = authUser.profile.groups;
      const authUserId = authUser.id;
      const constraints = FeedService._getIdConstrains(getNewsFeedDto);
      const { idGT, idGTE, idLT, idLTE } = getNewsFeedDto;
      const { schema } = getDatabaseConfig();
      const postTable = PostModel.tableName;
      const userNewsFeedModel = UserNewsFeedModel.tableName;
      const mentionTable = MentionModel.tableName;
      const postReactionTable = PostReactionModel.tableName;
      const mediaTable = MediaModel.tableName;
      const postMediaTable = PostMediaModel.tableName;
      const postGroupTable = PostGroupModel.tableName;
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
      "createdAt", "p"."updated_at" AS "updatedAt",
      CASE WHEN "p"."important_expired_at" > NOW() THEN 1 ELSE 0 END AS "isNowImportant" 
      FROM ${schema}.${postTable} AS "p" 
      INNER JOIN ${schema}.${userNewsFeedModel} AS "u" ON "u"."post_id" = "p"."id"
      WHERE "p"."is_draft" = false AND "u"."user_id" = :authUserId ${constraints}
      GROUP BY p.id
      OFFSET :offset LIMIT :limit
    ) AS "PostModel"
      LEFT JOIN ${schema}.${postGroupTable} AS "groups" ON "PostModel"."id" = "groups"."post_id" AND "groups"."group_id" IN (:groupIds)
      LEFT OUTER JOIN ( 
        ${schema}.${postMediaTable} AS "media->PostMediaModel" 
        INNER JOIN ${schema}.${mediaTable} AS "media" ON "media"."id" = "media->PostMediaModel"."media_id"
      ) ON "PostModel"."id" = "media->PostMediaModel"."post_id" 
      LEFT OUTER JOIN ${schema}.${mentionTable} AS "mentions" ON "PostModel"."id" = "mentions"."entity_id" AND "mentions"."mentionable_type" = 'post' 
      LEFT OUTER JOIN ${schema}.${postReactionTable} AS "ownerReactions" ON "PostModel"."id" = "ownerReactions"."post_id" AND "ownerReactions"."created_by" = :authUserId
      ORDER BY "PostModel"."isNowImportant" DESC, "PostModel"."createdAt" ${order}`;

      const rows: any[] = await this._sequelizeConnection.query(query, {
        replacements: {
          offset,
          limit: limit + 1,
          authUserId,
          groupIds,
          idGT,
          idGTE,
          idLT,
          idLTE,
        },
        type: QueryTypes.SELECT,
      });

      const posts = this.groupPosts(rows);

      const hasNextPage = posts.length === limit + 1;
      const rowsRemovedLatestElm = hasNextPage
        ? posts.filter((p) => p.id !== posts[posts.length - 1].id)
        : posts;

      await Promise.all([
        this._commonReaction.bindReactionToPosts(rowsRemovedLatestElm),
        this._mentionService.bindMentionsToPosts(rowsRemovedLatestElm),
        this._postService.bindActorToPost(rowsRemovedLatestElm),
        this._postService.bindAudienceToPost(rowsRemovedLatestElm),
      ]);
      const result = this._classTransformer.plainToInstance(PostResponseDto, rowsRemovedLatestElm, {
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
    const { limit, offset, order, groupId } = getTimelineDto;
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
    const { idGT, idGTE, idLT, idLTE } = getTimelineDto;
    const { schema } = getDatabaseConfig();
    const postTable = PostModel.tableName;
    const postGroupTable = PostGroupModel.tableName;
    const mentionTable = MentionModel.tableName;
    const postReactionTable = PostReactionModel.tableName;
    const mediaTable = MediaModel.tableName;
    const postMediaTable = PostMediaModel.tableName;
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
      "createdAt", "p"."updated_at" AS "updatedAt",
      CASE WHEN "p"."important_expired_at" > NOW() THEN 1 ELSE 0 END AS "isNowImportant" 
      FROM ${schema}.${postTable} AS "p" 
      INNER JOIN ${schema}.${postGroupTable} AS "g" ON "g"."post_id" = "p"."id"
      WHERE "p"."is_draft" = false AND "g"."group_id" IN (:groupIds) ${constraints}
      GROUP BY p.id
      OFFSET :offset LIMIT :limit
    ) AS "PostModel"
      INNER JOIN ${schema}.${postGroupTable} AS "groups" ON "PostModel"."id" = "groups"."post_id" AND "groups"."group_id" IN (:groupIds)
      LEFT OUTER JOIN ( 
        ${schema}.${postMediaTable} AS "media->PostMediaModel" 
        INNER JOIN ${schema}.${mediaTable} AS "media" ON "media"."id" = "media->PostMediaModel"."media_id"
      ) ON "PostModel"."id" = "media->PostMediaModel"."post_id" 
      LEFT OUTER JOIN ${schema}.${mentionTable} AS "mentions" ON "PostModel"."id" = "mentions"."entity_id" AND "mentions"."mentionable_type" = 'post' 
      LEFT OUTER JOIN ${schema}.${postReactionTable} AS "ownerReactions" ON "PostModel"."id" = "ownerReactions"."post_id" AND "ownerReactions"."created_by" = :authUserId
      ORDER BY "PostModel"."isNowImportant" DESC, "PostModel"."createdAt" ${order}`;
    const rows: any[] = await this._sequelizeConnection.query(query, {
      replacements: {
        groupIds,
        offset,
        limit: limit + 1,
        authUserId,
        idGT,
        idGTE,
        idLT,
        idLTE,
      },
      type: QueryTypes.SELECT,
    });
    const posts = this.groupPosts(rows);

    const hasNextPage = posts.length === limit + 1;
    const rowsRemovedLatestElm = hasNextPage
      ? posts.filter((p) => p.id !== posts[posts.length - 1].id)
      : posts;
    await Promise.all([
      this._commonReaction.bindReactionToPosts(rowsRemovedLatestElm),
      this._mentionService.bindMentionsToPosts(rowsRemovedLatestElm),
      this._postService.bindActorToPost(rowsRemovedLatestElm),
      this._postService.bindAudienceToPost(rowsRemovedLatestElm),
    ]);
    const result = this._classTransformer.plainToInstance(PostResponseDto, rowsRemovedLatestElm, {
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
   * @param postId
   * @returns object
   */
  public async deleteNewsFeedByPost(postId: number): Promise<number> {
    return await this._newsFeedModel.destroy({ where: { postId } });
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
}
