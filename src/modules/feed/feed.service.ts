import { GetNewsFeedDto } from './dto/request/get-newsfeed.dto';
import { PostResponseDto } from './../post/dto/responses/post.response.dto';
import { ClassTransformer } from 'class-transformer';
import { MentionService } from './../mention/mention.service';
import { GroupService } from './../../shared/group/group.service';
import { PostService } from './../post/post.service';
import { Op, QueryTypes, Sequelize } from 'sequelize';
import sequelize from 'sequelize';
import { PageDto } from '../../common/dto';
import { GetTimelineDto } from './dto/request';
import { UserService } from '../../shared/user';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { MediaModel } from '../../database/models/media.model';
import { MentionModel } from '../../database/models/mention.model';
import { IPost, PostModel } from '../../database/models/post.model';
import { PostGroupModel } from '../../database/models/post-group.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { IPostReaction, PostReactionModel } from '../../database/models/post-reaction.model';
import { getDatabaseConfig } from '../../config/database';
import { PostMediaModel } from '../../database/models/post-media.model';
import { CommonReactionService } from '../reaction/services';
import { UserDto } from '../auth';

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
   * @param getTimelineDto GetTimelineDto
   * @returns Promise resolve PageDto
   * @throws HttpException
   */
  public async getNewsFeed(authUser: UserDto, getNewsFeedDto: GetNewsFeedDto): Promise<any> {
    const { limit, offset } = getNewsFeedDto;

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
    "media"."id" as "mediaId",
    "media"."url",
    "media"."name",
    "media"."type"
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
      LEFT OUTER JOIN ${schema}.${postReactionTable} AS "ownerReactions" ON "PostModel"."id" = "ownerReactions"."post_id" AND "ownerReactions"."created_by" = :authUserId`;
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
      raw: true,
    });
    const posts = this.groupPosts(rows);
    const hasNextPage = posts.length === limit + 1 ? true : false;
    const rowsRemovedLatestElm = posts.filter((p) => p.id !== posts[posts.length - 1].id);
    console.log('posts=', JSON.stringify(posts, null, 4));
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
    "media"."id" as "mediaId",
    "media"."url",
    "media"."name",
    "media"."type"
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
      LEFT OUTER JOIN ${schema}.${postReactionTable} AS "ownerReactions" ON "PostModel"."id" = "ownerReactions"."post_id" AND "ownerReactions"."created_by" = :authUserId`;
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
      raw: true,
    });

    const posts = this.groupPosts(rows);
    const hasNextPage = posts.length === limit + 1 ? true : false;
    const rowsRemovedLatestElm = posts.filter((p) => p.id !== posts[posts.length - 1].id);
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
      constraints += 'p.id >= :idGT';
    }
    if (getTimelineDto.idLT) {
      constraints += 'p.id < :idGT';
    }
    if (getTimelineDto.idLTE) {
      constraints += 'p.id <= :idGT';
    }
    return constraints;
  }

  /**
   * Delete newsfeed by post
   * @param getTimelineDto GetTimelineDto
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
        result.push({
          id,
          commentsCount,
          isImportant,
          importantExpiredAt,
          isDraft,
          canComment,
          canReact,
          canShare,
          createdBy,
          updatedBy,
          createdAt,
          updatedAt,
          isNowImportant,
          groups: [{ groupId: post.groupId }],
          mentions: [{ userId: post.userId }],
          media: [
            {
              id: post.mediaId,
              url: post.url,
              name: post.name,
              type: post.type,
            },
          ],
        });
        return;
      }
      if (!postAdded.groups.find((g) => g.groupId === post.groupId)) {
        postAdded.groups.push({ groupId: post.groupId });
      }
      if (!postAdded.mentions.find((m) => m.userId === post.userId)) {
        postAdded.mentions.push({ userId: post.userId });
      }
      if (!postAdded.media.find((m) => m.id === post.mediaId)) {
        postAdded.media.push({
          id: post.mediaId,
          url: post.url,
          name: post.name,
        });
      }
    });
    return result;
  }
}
