import { MentionModel, IMention } from './mention.model';
import { IMedia, MediaModel } from './media.model';
import sequelize, {
  Optional,
  BelongsToManyAddAssociationsMixin,
  QueryTypes,
  DataTypes,
} from 'sequelize';
import {
  AllowNull,
  BelongsToMany,
  Column,
  CreatedAt,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
  Sequelize,
  DeletedAt,
  BelongsTo,
} from 'sequelize-typescript';
import { CommentModel, IComment } from './comment.model';
import { PostMediaModel } from './post-media.model';
import { IUserNewsFeed, UserNewsFeedModel } from './user-newsfeed.model';
import { PostGroupModel, IPostGroup } from './post-group.model';
import { PostReactionModel } from './post-reaction.model';
import { Literal } from 'sequelize/types/utils';
import { StringHelper } from '../../common/helpers';
import { getDatabaseConfig } from '../../config/database';
import { MentionableType } from '../../common/constants';
import { UserMarkReadPostModel } from './user-mark-read-post.model';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';
import { UserDto } from '../../modules/auth';
import { OrderEnum, PageOptionsDto } from '../../common/dto';
import { CategoryModel, ICategory } from './category.model';
import { ISeries, SeriesModel } from './series.model';
import { HashtagModel, IHashtag } from './hashtag.model';
import { PostCategoryModel } from './post-category.model';
import { PostSeriesModel } from './post-series.model';
import { PostHashtagModel } from './post-hashtag.model';
import { GetListArticlesDto } from '../../modules/article/dto/requests';
import { HashtagResponseDto } from '../../modules/hashtag/dto/responses/hashtag-response.dto';
import { ILinkPreview, LinkPreviewModel } from './link-preview.model';
import { GetTimelineDto } from '../../modules/feed/dto/request';

export enum PostPrivacy {
  PUBLIC = 'PUBLIC',
  OPEN = 'OPEN',
  PRIVATE = 'PRIVATE',
  SECRET = 'SECRET',
}
export interface IPost {
  id: string;
  createdBy: string;
  updatedBy: string;
  content: string;
  lang?: string;
  commentsCount: number;
  totalUsersSeen: number;
  isImportant: boolean;
  importantExpiredAt?: Date;
  isDraft: boolean;
  canReact: boolean;
  canShare: boolean;
  canComment: boolean;
  isProcessing?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  comments?: IComment[];
  media?: IMedia[];
  groups?: IPostGroup[];
  userNewsfeeds?: IUserNewsFeed[];
  mentions?: IMention[];
  mentionIds?: number[];
  reactionsCount?: string;
  giphyId?: string;
  markedReadPost?: boolean;
  isArticle: boolean;
  title?: string;
  summary?: string;
  views: number;
  categories?: ICategory[];
  series?: ISeries[];
  hashtags?: IHashtag[];
  privacy?: PostPrivacy;
  hashtagsJson?: HashtagResponseDto[];
  linkPreviewId?: string;
  linkPreview?: ILinkPreview;
  cover?: string;
}

@Table({
  tableName: 'posts',
  paranoid: true,
})
export class PostModel extends Model<IPost, Optional<IPost, 'id'>> implements IPost {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public commentsCount: number;

  @Column
  public totalUsersSeen: number;

  @Default(false)
  @Column
  public isImportant: boolean;

  @Column
  public importantExpiredAt?: Date;

  @Column
  public isDraft: boolean;

  @Column
  public canComment: boolean;

  @Column
  public canReact: boolean;

  @Column
  public isProcessing: boolean;

  @Column
  public canShare: boolean;

  @Column
  public isArticle: boolean;

  @AllowNull(true)
  @Column
  public content: string;

  @AllowNull(true)
  @Column
  public title: string;

  @AllowNull(true)
  @Column
  public summary: string;

  @AllowNull(true)
  @Column
  public lang: string;

  @Column
  public views: number;

  @AllowNull(true)
  @Column
  public giphyId: string;

  @Column
  public privacy: PostPrivacy;

  @Column({
    type: DataTypes.JSONB,
  })
  public hashtagsJson: HashtagResponseDto[];

  @AllowNull(false)
  @Column
  public createdBy: string;

  @AllowNull(false)
  @Column
  public updatedBy: string;

  @AllowNull(true)
  @Column
  public linkPreviewId: string;

  @AllowNull(true)
  @Column
  public cover: string;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;

  @DeletedAt
  @Column
  deletedAt?: Date;

  @HasMany(() => CommentModel)
  public comments?: CommentModel[];

  @BelongsToMany(() => MediaModel, () => PostMediaModel)
  public media?: MediaModel[];

  @BelongsToMany(() => CategoryModel, () => PostCategoryModel)
  public categories?: CategoryModel[];

  @HasMany(() => PostCategoryModel)
  public postCategories?: PostCategoryModel[];

  @BelongsToMany(() => HashtagModel, () => PostHashtagModel)
  public hashtags?: HashtagModel[];

  @HasMany(() => PostHashtagModel)
  public postHashtags?: PostHashtagModel[];

  @BelongsToMany(() => SeriesModel, () => PostSeriesModel)
  public series?: SeriesModel[];

  @HasMany(() => PostSeriesModel)
  public postSeries?: PostSeriesModel[];

  @HasMany(() => MentionModel, {
    foreignKey: 'entityId',
    constraints: false,
    scope: {
      [StringHelper.camelToSnakeCase('mentionableType')]: MentionableType.POST,
    },
  })
  public mentions?: MentionModel[];

  public addMedia?: BelongsToManyAddAssociationsMixin<MediaModel, number>;

  @HasMany(() => PostGroupModel)
  public groups: PostGroupModel[];

  @HasMany(() => UserNewsFeedModel)
  public userNewsfeeds: UserNewsFeedModel[];

  @HasMany(() => PostReactionModel)
  public reactions: PostReactionModel[];

  @HasMany(() => UserNewsFeedModel)
  public userNewsFeeds: UserNewsFeedModel[];

  @BelongsTo(() => LinkPreviewModel, {
    foreignKey: 'linkPreviewId',
  })
  public linkPreview: LinkPreviewModel;

  @HasMany(() => PostReactionModel, {
    as: 'ownerReactions',
    foreignKey: 'postId',
  })
  public postReactions: PostReactionModel[];

  public reactionsCount: string;

  @BelongsTo(() => MediaModel, {
    foreignKey: 'cover',
  })
  public coverMedia: MediaModel;

  public static loadMarkReadPost(authUserId: string, alias?: string): [Literal, string] {
    const { schema } = getDatabaseConfig();
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;
    if (!authUserId) {
      return [Sequelize.literal(`(false)`), alias ? alias : 'markedReadPost'];
    }
    return [
      Sequelize.literal(`(
        COALESCE((SELECT true FROM ${schema}.${userMarkReadPostTable} as r
          WHERE r.post_id = "PostModel".id AND r.user_id = ${this.sequelize.escape(
            authUserId
          )}), false)
               )`),
      alias ? alias : 'markedReadPost',
    ];
  }

  public static loadContent(alias?: string): [Literal, string] {
    return [
      Sequelize.literal(`(CASE WHEN is_article = false THEN content ELSE null END)`),
      alias ? alias : 'content',
    ];
  }

  public static loadLock(groupIds: string[], alias?: string): [Literal, string] {
    const { schema } = getDatabaseConfig();
    const postGroupTable = PostGroupModel.tableName;
    return [
      Sequelize.literal(`(
        CASE WHEN "PostModel".privacy = '${
          PostPrivacy.PRIVATE
        }' AND COALESCE((SELECT true FROM ${schema}.${postGroupTable} as spg
          WHERE spg.post_id = "PostModel".id AND spg.group_id IN(${groupIds
            .map((id) => this.sequelize.escape(id))
            .join(',')}) ), FALSE) = FALSE THEN TRUE ELSE FALSE END
               )`),
      alias ? alias : 'isLocked',
    ];
  }

  public static loadReactionsCount(alias?: string): [Literal, string] {
    const { schema } = getDatabaseConfig();
    return [
      Sequelize.literal(`(
                  SELECT concat(1,reaction_name_list,'=',total_list) FROM (
                         SELECT
                               1,
                               string_agg(RN,',') AS reaction_name_list,
                               string_agg(cast(TT as varchar),',') AS total_list
                               FROM (
                                       SELECT
                                           COUNT(${schema}.posts_reactions.id ) as TT,
                                           ${schema}.posts_reactions.reaction_name as RN,
                                           MIN(${schema}.posts_reactions.created_at) as minDate
                                       FROM   ${schema}.posts_reactions
                                       WHERE  ${schema}.posts_reactions.post_id = "PostModel"."id"
                                       GROUP BY ${schema}.posts_reactions.reaction_name
                                       ORDER BY minDate ASC
                               ) as orderBefore
                       ) AS RC
                  GROUP BY 1
               )`),
      alias ? alias : 'reactionsCount',
    ];
  }

  public static loadCommentsCount(alias?: string): [Literal, string] {
    const { schema } = getDatabaseConfig();
    return [
      Sequelize.literal(
        `(SELECT COUNT(*) FROM ${schema}.comments WHERE ${schema}.comments.post_id="PostModel"."id")`
      ),
      alias ?? 'commentsCount',
    ];
  }

  public static importantPostsFirstCondition(alias?: string): [Literal, string] {
    return [
      sequelize.literal(`CASE WHEN "PostModel"."important_expired_at" > NOW() THEN 1 ELSE 0 END`),
      alias ?? 'isNowImportant',
    ];
  }

  public static parseAggregatedReaction(value: string): Record<string, Record<string, number>> {
    if (value && value !== '1=') {
      const rawReactionsCount: string = value.substring(1);
      const [s1, s2] = rawReactionsCount.split('=');
      const reactionsName = s1.split(',');
      const total = s2.split(',');
      const reactionsCount = {};
      reactionsName.forEach((v, i) => (reactionsCount[i] = { [v]: parseInt(total[i]) }));
      return reactionsCount;
    }
    return null;
  }

  public static getIdConstrains(
    getPostsDto: Pick<PageOptionsDto, 'idGT' | 'idGTE' | 'idLT' | 'idLTE'>
  ): string {
    const { schema } = getDatabaseConfig();
    const postCategoryTable = PostCategoryModel.tableName;
    const postSeriesTable = PostSeriesModel.tableName;
    const postHastagTable = PostHashtagModel.tableName;
    let constraints = '';
    if ((getPostsDto as GetListArticlesDto).categories?.length > 0) {
      constraints += `AND EXISTS(
        SELECT 1
        from ${schema}.${postCategoryTable} AS pc
        WHERE pc.post_id = p.id
        AND pc.category_id IN(:categoryIds)
      )`;
    }
    if ((getPostsDto as GetListArticlesDto).series?.length > 0) {
      constraints += `AND EXISTS(
        SELECT 1
        from ${schema}.${postSeriesTable} AS ps
        WHERE ps.post_id = p.id
        AND ps.series_id IN(:seriesIds)
      )`;
    }
    if ((getPostsDto as GetListArticlesDto).hashtags?.length > 0) {
      constraints += `AND EXISTS(
        SELECT 1
        from ${schema}.${postHastagTable} AS ph
        WHERE ph.post_id = p.id
        AND ph.hashtag_id IN(:hashtagIds)
      )`;
    }
    return constraints;
  }

  public static async getTimelineData({
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
    groupIds: string[];
    isImportant: boolean;
    idGT?: string;
    idGTE?: string;
    idLT?: string;
    idLTE?: string;
    offset?: number;
    limit?: number;
    order?: OrderEnum;
  }): Promise<any[]> {
    let condition = this.getIdConstrains({ idGT, idGTE, idLT, idLTE });
    const { schema } = getDatabaseConfig();
    const postTable = PostModel.tableName;
    const postGroupTable = PostGroupModel.tableName;
    const mentionTable = MentionModel.tableName;
    const postReactionTable = PostReactionModel.tableName;
    const mediaTable = MediaModel.tableName;
    const postMediaTable = PostMediaModel.tableName;
    const postCategoryTable = PostCategoryModel.tableName;
    const categoryTable = CategoryModel.tableName;
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;
    const authUserId = authUser ? authUser.id : null;
    if (isImportant) {
      condition += `AND "p"."is_important" = true AND NOT EXISTS(
        SELECT 1
        from ${schema}.${userMarkReadPostTable} AS r
        WHERE r.post_id = p.id AND r.user_id = :authUserId
      )`;
    } else {
      condition += `AND ("p"."is_important" = false OR 
                        ( "p"."is_important" = true AND EXISTS(
                          SELECT 1
                          from ${schema}.${userMarkReadPostTable} AS r
                          WHERE r.post_id = p.id AND r.user_id = :authUserId
                        ))
                      )`;
    }
    const subQueryGetPosts = `
    SELECT
          "p"."id",
          "p"."comments_count" AS "commentsCount",
          "p"."total_users_seen" AS "totalUsersSeen",
          "p"."is_important" AS "isImportant",
          "p"."important_expired_at" AS "importantExpiredAt", 
          "p"."is_draft" AS "isDraft",
          "p"."can_comment" AS "canComment", 
          "p"."can_react" AS "canReact", 
          "p"."can_share" AS "canShare",
          "p"."content", 
          "p"."created_by" AS "createdBy", 
          "p"."updated_by" AS "updatedBy", 
          "p"."created_at" AS "createdAt", 
          "p"."updated_at" AS "updatedAt",
          "p"."is_article" AS "isArticle", 
          "p"."title" AS "title", 
          "p"."summary" AS "summary",
          "p"."hashtags_json" AS "hashtags",
          COALESCE((SELECT true FROM ${schema}.${userMarkReadPostTable} as r
            WHERE r.post_id = p.id ${authUserId ? 'AND r.user_id = :authUserId' : ''} ), false
          ) AS "markedReadPost"
    FROM ${schema}.${postTable} AS "p"
    WHERE "p"."deleted_at" IS NULL AND "p"."is_draft" = false AND EXISTS(
      SELECT 1
      from ${schema}.${postGroupTable} AS g
      WHERE g.post_id = p.id
      AND g.group_id IN(:groupIds)
    ) ${condition}
    ORDER BY "p"."created_at" ${order}
    OFFSET :offset LIMIT :limit`;

    const queryGetPostsAndRelationTables = `
    SELECT
          "PostModel".*,
          "groups"."group_id" as "groupId",
          "mentions"."user_id" as "userId",
          "ownerReactions"."reaction_name" as "reactionName",
          "ownerReactions"."id" as "postReactionId",
          "ownerReactions"."created_at" as "reactCreatedAt",
          "cate"."name" as "categoryName",
          "cate"."id" as "categoryId",
          "media"."id" as "mediaId",
          "media"."url",
          "media"."name",
          "media"."type",
          "media"."size",
          "media"."width",
          "media"."height",
          "media"."extension",
          "media"."mime_type" as "mimeType",
          "media"."thumbnails",
          "media"."created_at" as "mediaCreatedAt"
    FROM (${subQueryGetPosts}) AS "PostModel"
    LEFT JOIN ${schema}.${postGroupTable} AS "groups" ON "PostModel"."id" = "groups"."post_id"
    LEFT OUTER JOIN (
      ${schema}.${postMediaTable} AS "media->PostMediaModel"
      INNER JOIN ${schema}.${mediaTable} AS "media" ON "media"."id" = "media->PostMediaModel"."media_id"
    ) ON "PostModel"."id" = "media->PostMediaModel"."post_id"
    LEFT OUTER JOIN (
      ${schema}.${postCategoryTable} AS "media->PostCategoryModel"
      INNER JOIN ${schema}.${categoryTable} AS "cate" ON "cate"."id" = "media->PostCategoryModel"."category_id"
    ) ON "PostModel"."id" = "media->PostCategoryModel"."post_id"
    LEFT OUTER JOIN ${schema}.${mentionTable} AS "mentions" 
      ON "PostModel"."id" = "mentions"."entity_id" AND "mentions"."mentionable_type" = 'post'
    LEFT OUTER JOIN ${schema}.${postReactionTable} AS "ownerReactions" 
      ON "PostModel"."id" = "ownerReactions"."post_id" ${
        authUserId ? 'AND "ownerReactions"."created_by" = :authUserId' : ''
      }
    ORDER BY "PostModel"."createdAt" ${order}`;
    const rows: any[] = await this.sequelize.query(queryGetPostsAndRelationTables, {
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

  public static async getArticlesData(
    getArticleListDto: GetListArticlesDto,
    authUser: UserDto
  ): Promise<any[]> {
    const {
      groupIds,
      categories,
      hashtags,
      series,
      offset,
      limit,
      orderField,
      order,
      idGT,
      idGTE,
      idLT,
      idLTE,
    } = getArticleListDto;
    const userGroupIds = authUser.profile.groups;
    let condition = this.getIdConstrains(getArticleListDto);
    const { schema } = getDatabaseConfig();
    const postTable = PostModel.tableName;
    const postGroupTable = PostGroupModel.tableName;
    const mentionTable = MentionModel.tableName;
    const postReactionTable = PostReactionModel.tableName;
    const mediaTable = MediaModel.tableName;
    const postMediaTable = PostMediaModel.tableName;
    const postCategoryTable = PostCategoryModel.tableName;
    const categoryTable = CategoryModel.tableName;
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;
    const authUserId = authUser.id;

    if (groupIds && groupIds.length > 0) {
      condition += `AND EXISTS(
        SELECT 1
        from ${schema}.${postGroupTable} AS g
        WHERE g.post_id = p.id
        AND g.group_id IN(:groupIds)
      )`;
    }
    const subQueryGetPosts = `
      SELECT
            "p"."id",
            "p"."comments_count" AS "commentsCount",
            "p"."total_users_seen" AS "totalUsersSeen",
            "p"."views",
            "p"."title",
            "p"."summary",
            "p"."is_important" AS "isImportant",
            "p"."important_expired_at" AS "importantExpiredAt", 
            "p"."is_draft" AS "isDraft", 
            "p"."is_article" AS "isArticle",
            "p"."can_comment" AS "canComment", 
            "p"."can_react" AS "canReact", 
            "p"."can_share" AS "canShare",
            "p"."content", 
            "p"."created_by" AS "createdBy", 
            "p"."updated_by" AS "updatedBy", 
            "p"."created_at" AS "createdAt", 
            "p"."updated_at" AS "updatedAt",
            COALESCE((SELECT true FROM ${schema}.${userMarkReadPostTable} as r
              WHERE r.post_id = p.id AND r.user_id = :authUserId ), false
            ) AS "markedReadPost",
            CASE WHEN p.privacy = '${PostPrivacy.PRIVATE}'
              AND COALESCE((SELECT true FROM ${schema}.${postGroupTable} as spg
              WHERE spg.post_id = p.id AND spg.group_id IN(:userGroupIds) ), FALSE) = FALSE THEN TRUE ELSE FALSE
            END as "isLocked"
        FROM ${schema}.${postTable} AS "p"
        WHERE 
            "p"."deleted_at" IS NULL 
            AND "p"."is_draft" = false
            AND "p"."is_article" = true 
            AND EXISTS(
              SELECT 1
              from ${schema}.${postGroupTable} AS g
              WHERE g.post_id = p.id
              AND g.group_id IN(:userGroupIds)
            ) ${condition}
        ORDER BY ${orderField ? `"${orderField}"` : 'RANDOM()'} ${orderField ? order : ''}
        OFFSET :offset LIMIT :limit
    `;
    const query = `SELECT
    "PostModel".*,
    "groups"."group_id" as "groupId",
    "mentions"."user_id" as "userId",
    "ownerReactions"."reaction_name" as "reactionName",
    "ownerReactions"."id" as "postReactionId",
    "ownerReactions"."created_at" as "reactCreatedAt",
    "cate"."name" as "categoryName",
    "cate"."id" as "categoryId",
    "media"."id" as "mediaId",
    "media"."url",
    "media"."name",
    "media"."type",
    "media"."size",
    "media"."width",
    "media"."height",
    "media"."extension",
    "media"."mime_type" as "mimeType",
    "media"."thumbnails",
    "media"."created_at" as "mediaCreatedAt"
    FROM ( ${subQueryGetPosts} ) AS "PostModel"
    LEFT JOIN ${schema}.${postGroupTable} AS "groups" ON "PostModel"."id" = "groups"."post_id"
    LEFT OUTER JOIN (
        ${schema}.${postMediaTable} AS "media->PostMediaModel"
        INNER JOIN ${schema}.${mediaTable} AS "media" ON "media"."id" = "media->PostMediaModel"."media_id"
    ) ON "PostModel"."id" = "media->PostMediaModel"."post_id"
    LEFT OUTER JOIN (
      ${schema}.${postCategoryTable} AS "media->PostCategoryModel"
      INNER JOIN ${schema}.${categoryTable} AS "cate" ON "cate"."id" = "media->PostCategoryModel"."category_id"
    ) ON "PostModel"."id" = "media->PostCategoryModel"."post_id"
    LEFT OUTER JOIN ${schema}.${mentionTable} AS "mentions" 
      ON "PostModel"."id" = "mentions"."entity_id" AND "mentions"."mentionable_type" = 'post'
    LEFT OUTER JOIN ${schema}.${postReactionTable} AS "ownerReactions" 
      ON "PostModel"."id" = "ownerReactions"."post_id" AND "ownerReactions"."created_by" = :authUserId
    ORDER BY ${orderField ? '"${orderField}"' : 'RANDOM()'} ${orderField ? order : ''}`;
    const rows: any[] = await this.sequelize.query(query, {
      replacements: {
        groupIds,
        userGroupIds,
        offset,
        limit: limit,
        authUserId,
        idGT,
        idGTE,
        idLT,
        idLTE,
        categoryIds: categories,
        hashtagIds: hashtags,
        seriesIds: series,
        orderField,
      },
      type: QueryTypes.SELECT,
    });

    return rows;
  }

  public static async getNewsFeedData({
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
    authUserId: string;
    isImportant: boolean;
    idGT?: string;
    idGTE?: string;
    idLT?: string;
    idLTE?: string;
    offset?: number;
    limit?: number;
    order?: OrderEnum;
  }): Promise<any[]> {
    let condition = this.getIdConstrains({ idGT, idGTE, idLT, idLTE });
    const { schema } = getDatabaseConfig();
    const postTable = PostModel.tableName;
    const userNewsFeedTable = UserNewsFeedModel.tableName;
    const mentionTable = MentionModel.tableName;
    const postReactionTable = PostReactionModel.tableName;
    const mediaTable = MediaModel.tableName;
    const postMediaTable = PostMediaModel.tableName;
    const postCategoryTable = PostCategoryModel.tableName;
    const categoryTable = CategoryModel.tableName;
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;
    const postGroupTable = PostGroupModel.tableName;
    let subSelect = `
        SELECT 
          "p"."id",
          "p"."comments_count" AS "commentsCount",
          "p"."total_users_seen" AS "totalUsersSeen",
          "p"."is_important" AS "isImportant",
          "p"."important_expired_at" AS "importantExpiredAt", 
          "p"."is_draft" AS "isDraft",
          "p"."can_comment" AS "canComment", 
          "p"."can_react" AS "canReact", 
          "p"."can_share" AS "canShare",
          "p"."content", 
          "p"."created_by" AS "createdBy", 
          "p"."updated_by" AS "updatedBy", 
          "p"."created_at" AS "createdAt", 
          "p"."updated_at" AS "updatedAt",
          "p"."is_article" AS "isArticle", 
          "p"."title" AS "title", 
          "p"."summary" AS "summary",
          "p"."hashtags_json" AS "hashtags",
          "is_seen_post" AS "isSeenPost"`;
    if (isImportant === true) {
      condition += `AND "p"."is_important" = true`;
      subSelect += `, COALESCE((SELECT true FROM ${schema}.${userMarkReadPostTable} as r
        WHERE r.post_id = p.id AND r.user_id = :authUserId ), false
      ) AS "markedReadPost"`;
    } else {
      subSelect += `, COALESCE((SELECT true FROM ${schema}.${userMarkReadPostTable} as r
        WHERE r.post_id = p.id AND r.user_id = :authUserId ), false
      ) AS "markedReadPost" `;
    }

    const subQueryGetPosts = `
                ${subSelect}
                FROM ${schema}.${postTable} AS "p"
                INNER JOIN ${schema}.${userNewsFeedTable} AS u ON u.post_id = p.id AND u.user_id  = :authUserId
                WHERE "p"."deleted_at" IS NULL AND "p"."is_draft" = false ${condition}
                ORDER BY ${isImportant ? '"markedReadPost" ASC,' : ''} "p"."created_at" ${order}
                OFFSET :offset LIMIT :limit`;

    const query = `
      SELECT
          "PostModel".*,
          "groups"."group_id" as "groupId",
          "mentions"."user_id" as "userId",
          "ownerReactions"."reaction_name" as "reactionName",
          "ownerReactions"."id" as "postReactionId",
          "ownerReactions"."created_at" as "reactCreatedAt",
          "cate"."name" as "categoryName",
          "cate"."id" as "categoryId",
          "media"."id" as "mediaId",
          "media"."url",
          "media"."name",
          "media"."type",
          "media"."width",
          "media"."size",
          "media"."height",
          "media"."extension",
          "media"."mime_type" as "mimeType",
          "media"."thumbnails",
          "media"."created_at" as "mediaCreatedAt"
      FROM ( ${subQueryGetPosts} ) AS "PostModel"
      LEFT JOIN ${schema}.${postGroupTable} AS "groups" ON "PostModel"."id" = "groups"."post_id"
      LEFT OUTER JOIN (
        ${schema}.${postMediaTable} AS "media->PostMediaModel"
        INNER JOIN ${schema}.${mediaTable} AS "media" ON "media"."id" = "media->PostMediaModel"."media_id"
      ) ON "PostModel"."id" = "media->PostMediaModel"."post_id"
      LEFT OUTER JOIN (
        ${schema}.${postCategoryTable} AS "media->PostCategoryModel"
        INNER JOIN ${schema}.${categoryTable} AS "cate" ON "cate"."id" = "media->PostCategoryModel"."category_id"
      ) ON "PostModel"."id" = "media->PostCategoryModel"."post_id"
      LEFT OUTER JOIN ${schema}.${mentionTable} AS "mentions" 
        ON "PostModel"."id" = "mentions"."entity_id" AND "mentions"."mentionable_type" = 'post'
      LEFT OUTER JOIN ${schema}.${postReactionTable} AS "ownerReactions" 
        ON "PostModel"."id" = "ownerReactions"."post_id" AND "ownerReactions"."created_by" = :authUserId
      ORDER BY ${isImportant ? '"markedReadPost" ASC,' : ''} "PostModel"."createdAt" ${order}`;

    const rows: any[] = await this.sequelize.query(query, {
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

  public static async getTotalImportantPostInGroups(
    groupIds: string[],
    getTimelineDto: GetTimelineDto
  ): Promise<number> {
    const { schema } = getDatabaseConfig();
    const constraints = PostModel.getIdConstrains(getTimelineDto);
    const query = `SELECT COUNT(*) as total
    FROM ${schema}.posts as p
    WHERE "p"."deleted_at" IS NULL AND "p"."is_draft" = false AND "p"."important_expired_at" > NOW()
    AND EXISTS(
        SELECT 1
        from ${schema}.posts_groups AS g
        WHERE g.post_id = p.id
        AND g.group_id IN(:groupIds)
      )
    ${constraints}`;
    const result: any = await this.sequelize.query(query, {
      replacements: {
        groupIds,
      },
      type: QueryTypes.SELECT,
    });
    return result[0].total;
  }

  public static async getTotalImportantPostInNewsFeed(
    userId: string,
    constraints: string
  ): Promise<number> {
    const { schema } = getDatabaseConfig();
    const postTable = PostModel.tableName;
    const userNewsFeedtable = UserNewsFeedModel.tableName;
    const query = `SELECT COUNT(*) as total
    FROM ${schema}.${postTable} as p
    WHERE "p"."deleted_at" IS NULL AND  "p"."is_draft" = false AND "p"."important_expired_at" > NOW()
    AND EXISTS(
        SELECT 1
        from ${schema}.${userNewsFeedtable} AS u
        WHERE u.post_id = p.id
        AND u.user_id = :userId
      )
    ${constraints}`;
    const result: any = await this.sequelize.query(query, {
      replacements: {
        userId,
      },
      type: QueryTypes.SELECT,
    });
    return result[0].total;
  }
}
