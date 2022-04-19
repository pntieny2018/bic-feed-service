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
   * Get timeline
   * @param authUserId number
   * @param getTimelineDto GetTimelineDto
   * @returns Promise resolve PageDto
   * @throws HttpException
   */
  public async getTimeline(
    authUserId: number,
    getTimelineDto: GetTimelineDto
  ): Promise<PageDto<PostResponseDto>> {
    const { limit, offset, groupId } = getTimelineDto;
    const group = await this._groupService.get(groupId);
    if (!group) {
      throw new BadRequestException(`Group ${groupId} not found`);
    }
    const groupIds = [groupId, ...group.child];
    const constraints = FeedService._getIdConstrains(getTimelineDto);
    const rows = await this._postModel.findAll<PostModel>({
      where: {
        ...constraints,
        ...{
          isDraft: false,
        },
      },
      attributes: {
        include: [PostModel.loadReactionsCount(), PostModel.importantPostsFirstCondition()],
      },
      include: [
        {
          model: PostGroupModel,
          attributes: ['groupId', 'postId'],
          where: {
            groupId: groupIds,
          },
          required: true,
        },
        {
          model: PostGroupModel,
          attributes: ['groupId', 'postId'],
          required: true,
        },
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          required: false,
        },
        {
          model: MentionModel,
          required: false,
        },
        {
          model: PostReactionModel,
          as: 'ownerReactions',
          where: {
            createdBy: authUserId,
          },
          required: false,
        },
      ],
      offset: offset,
      limit: limit,
      order: [
        [sequelize.col('isNowImportant'), 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    const total = await this._postModel.count({
      where: {
        ...constraints,
      },
      include: [
        {
          model: PostGroupModel,
          attributes: ['groupId', 'postId'],
          where: {
            groupId: groupIds,
          },
          required: true,
        },
      ],
      distinct: true,
    });
    const jsonPosts = rows.map((r) => r.toJSON());
    await this._mentionService.bindMentionsToPosts(jsonPosts);
    await this._postService.bindActorToPost(jsonPosts);
    await this._postService.bindAudienceToPost(jsonPosts);

    const result = this._classTransformer.plainToInstance(PostResponseDto, jsonPosts, {
      excludeExtraneousValues: true,
    });

    return new PageDto<PostResponseDto>(result, {
      total,
      limit,
      offset,
    });
  }

  /**
   * Get newsfeed
   * @param authUserId number
   * @param getNewsFeedDto GetTimelineDto
   * @returns Promise resolve PageDto
   * @throws HttpException
   */
  public async getNewsFeed(
    authUserId: number,
    getNewsFeedDto: GetNewsFeedDto
  ): Promise<PageDto<PostResponseDto>> {
    const { limit, offset } = getNewsFeedDto;
    const constraints = FeedService._getIdConstrains(getNewsFeedDto);
    const rows = await this._postModel.findAll<PostModel>({
      where: {
        ...constraints,
        ...{
          isDraft: false,
        },
      },
      attributes: {
        include: [PostModel.loadReactionsCount(), PostModel.importantPostsFirstCondition()],
      },
      include: [
        {
          model: UserNewsFeedModel,
          attributes: ['userId'],
          where: {
            userId: authUserId,
          },
          required: true,
        },
        {
          model: PostGroupModel,
          attributes: ['groupId', 'postId'],
          required: true,
        },
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          required: false,
        },
        {
          model: MentionModel,
          required: false,
        },
        {
          model: PostReactionModel,
          as: 'ownerReactions',
          where: {
            createdBy: authUserId,
          },
          required: false,
        },
      ],
      offset: offset,
      limit: limit,
      order: [
        [sequelize.col('isNowImportant'), 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    const total = await this._postModel.count({
      where: {
        ...constraints,
      },
      include: [
        {
          model: UserNewsFeedModel,
          attributes: ['userId'],
          where: {
            userId: authUserId,
          },
          required: true,
        },
      ],
      distinct: true,
    });

    const jsonPosts = rows.map((r) => r.toJSON());
    await this._mentionService.bindMentionsToPosts(jsonPosts);
    await this._postService.bindActorToPost(jsonPosts);
    await this._postService.bindAudienceToPost(jsonPosts);

    const result = this._classTransformer.plainToInstance(PostResponseDto, jsonPosts, {
      excludeExtraneousValues: true,
    });

    return new PageDto<PostResponseDto>(result, {
      total,
      limit,
      offset,
    });
  }

  /**
   * Get Timelinev2
   * @param authUserId number
   * @param getTimelineDto GetTimelineDto
   * @returns Promise resolve PageDto
   * @throws HttpException
   */
  public async getTimelinev2(authUserId: number, getTimelineDto: GetTimelineDto): Promise<any> {
    const { limit, offset, groupId } = getTimelineDto;
    const group = await this._groupService.get(groupId);
    if (!group) {
      throw new BadRequestException(`Group ${groupId} not found`);
    }
    const groupIds = [groupId, ...group.child];

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
    "media"."id",
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
      WHERE "p"."is_draft" = false AND "g"."group_id" IN (:groupIds)
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
  private static _getIdConstrains(getTimelineDto: GetTimelineDto | GetNewsFeedDto): object {
    const constraints = {};
    if (getTimelineDto.idGT) {
      constraints['id'] = {
        [Op.gt]: getTimelineDto.idGT,
        ...constraints['id'],
      };
    }
    if (getTimelineDto.idGTE) {
      constraints['id'] = {
        [Op.gte]: getTimelineDto.idGTE,
        ...constraints['id'],
      };
    }
    if (getTimelineDto.idLT) {
      constraints['id'] = {
        [Op.lt]: getTimelineDto.idLT,
        ...constraints['id'],
      };
    }
    if (getTimelineDto.idLTE) {
      constraints['id'] = {
        [Op.lte]: getTimelineDto.idLTE,
        ...constraints['id'],
      };
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
