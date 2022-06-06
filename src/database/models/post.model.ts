import { MentionModel, IMention } from './mention.model';
import { IMedia } from './media.model';
import { Optional, BelongsToManyAddAssociationsMixin, QueryTypes, DataTypes } from 'sequelize';
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
} from 'sequelize-typescript';
import { CommentModel, IComment } from './comment.model';
import { MediaModel } from './media.model';
import { PostMediaModel } from './post-media.model';
import { UserNewsFeedModel } from './user-newsfeed.model';
import { PostGroupModel, IPostGroup } from './post-group.model';
import { PostReactionModel } from './post-reaction.model';
import { Literal } from 'sequelize/types/utils';
import sequelize from 'sequelize';
import { StringHelper } from '../../common/helpers';
import { getDatabaseConfig } from '../../config/database';
import { MentionableType } from '../../common/constants';
import { UserMarkReadPostModel } from './user-mark-read-post.model';
import { IsUUID } from 'class-validator';
import { NIL as NIL_UUID, v4 as uuid_v4 } from 'uuid';
import { UserDto } from '../../modules/auth';
import { OrderEnum } from '../../common/dto';
import { GetTimelineDto } from '../../modules/feed/dto/request';
import { GetNewsFeedDto } from '../../modules/feed/dto/request/get-newsfeed.dto';
import { CategoryModel, ICategory } from './category.model';
import { ISeries, SeriesModel } from './series.model';
import { HashtagModel, IHashtag } from './hashtag.model';
import { PostCategoryModel } from './post-category.model';
import { PostSeriesModel } from './post-series.model';
import { PostHashtagModel } from './post-hashtag.model';
import { GetArticleDto, GetListArticlesDto } from '../../modules/article/dto/requests';
import { HashtagResponseDto } from '../../modules/hashtag/dto/responses/hashtag-response.dto';

export enum PostPrivacy {
  PUBLIC = 'PUBLIC',
  OPEN = 'OPEN',
  PRIVATE = 'PRIVATE',
  SECRET = 'SECRET',
}
export interface IPost {
  id: string;
  createdBy: number;
  updatedBy: number;
  content: string;
  commentsCount: number;
  isImportant: boolean;
  importantExpiredAt?: Date;
  isDraft: boolean;
  canReact: boolean;
  canShare: boolean;
  canComment: boolean;
  isProcessing?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  comments?: IComment[];
  media?: IMedia[];
  groups?: IPostGroup[];
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
}

@Table({
  tableName: 'posts',
})
export class PostModel extends Model<IPost, Optional<IPost, 'id'>> implements IPost {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public commentsCount: number;

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
  public createdBy: number;

  @AllowNull(false)
  @Column
  public updatedBy: number;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;

  @HasMany(() => CommentModel)
  public comments?: CommentModel[];

  @BelongsToMany(() => MediaModel, () => PostMediaModel)
  public media?: MediaModel[];

  @BelongsToMany(() => CategoryModel, () => PostCategoryModel)
  public categories?: CategoryModel[];

  @BelongsToMany(() => HashtagModel, () => PostHashtagModel)
  public hashtags?: HashtagModel[];

  @BelongsToMany(() => SeriesModel, () => PostSeriesModel)
  public series?: SeriesModel[];

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

  @HasMany(() => PostReactionModel)
  public reactions: PostReactionModel[];

  @HasMany(() => UserNewsFeedModel, {
    foreignKey: 'postId',
  })
  public userNewsFeeds: UserNewsFeedModel[];

  @HasMany(() => PostReactionModel, {
    as: 'ownerReactions',
    foreignKey: 'postId',
  })
  public postReactions: PostReactionModel[];

  public reactionsCount: string;

  public static loadMarkReadPost(authUserId: number, alias?: string): [Literal, string] {
    const { schema } = getDatabaseConfig();
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;
    return [
      Sequelize.literal(`(
        COALESCE((SELECT true FROM ${schema}.${userMarkReadPostTable} as r 
          WHERE r.post_id = "PostModel".id AND r.user_id = ${authUserId}), false)
               )`),
      alias ? alias : 'markedReadPost',
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
      const rawReactionsCount: string = (value as string).substring(1);
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
    getPostsDto: GetTimelineDto | GetNewsFeedDto | GetListArticlesDto
  ): string {
    const { schema } = getDatabaseConfig();
    const { idGT, idGTE, idLT, idLTE } = getPostsDto;
    const postCategoryTable = PostCategoryModel.tableName;
    const postSeriesTable = PostSeriesModel.tableName;
    const postHastagTable = PostHashtagModel.tableName;
    const postGroupTable = PostGroupModel.tableName;
    let constraints = '';
    if (idGT) {
      constraints += `AND p.id != ${this.sequelize.escape(idGT)}`;
      constraints += `AND p.created_at >= (SELECT p_subquery.created_at FROM ${schema}.posts AS p_subquery WHERE p_subquery.id=${this.sequelize.escape(
        idGT
      )})`;
    }
    if (idGTE) {
      constraints += `AND p.created_at >= (SELECT p_subquery.created_at FROM ${schema}.posts AS p_subquery WHERE p_subquery.id=${this.sequelize.escape(
        idGT
      )})`;
    }
    if (idLT) {
      constraints += `AND p.id != ${this.sequelize.escape(idLT)}`;
      constraints += `AND p.created_at <= (SELECT p_subquery.created_at FROM ${schema}.posts AS p_subquery WHERE p_subquery.id=${this.sequelize.escape(
        idLT
      )})`;
    }
    if (idLTE) {
      constraints += `AND p.created_at <= (SELECT p_subquery.created_at FROM ${schema}.posts AS p_subquery WHERE p_subquery.id=${this.sequelize.escape(
        idLT
      )})`;
    }
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
    // if ((getPostsDto as GetListArticlesDto).groupId) {
    //   constraints += `AND EXISTS(
    //     SELECT 1
    //     from ${schema}.${postGroupTable} AS pg
    //     WHERE pg.post_id = p.id
    //     AND pg.group_id = :groupId
    //   )`;
    // }
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
    let condition = this.getIdConstrains({ idGT, idGTE, idLT, idLTE });
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
      condition += `AND "p"."is_important" = true AND "p"."important_expired_at" > NOW()`;
    } else {
      condition += `AND ("p"."important_expired_at" IS NULL OR "p"."important_expired_at" <= NOW())`;
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
    "media"."size",
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
      COALESCE((SELECT true FROM ${schema}.${userMarkReadPostTable} as r 
        WHERE r.post_id = p.id AND r.user_id = :authUserId ), false
      ) AS "markedReadPost"
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
    const rows: any[] = await this.sequelize.query(query, {
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
      groupId,
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
    const groupIds = authUser.profile.groups;
    const condition = this.getIdConstrains(getArticleListDto);
    const { schema } = getDatabaseConfig();
    const postTable = PostModel.tableName;
    const postGroupTable = PostGroupModel.tableName;
    const mentionTable = MentionModel.tableName;
    const postReactionTable = PostReactionModel.tableName;
    const mediaTable = MediaModel.tableName;
    const postMediaTable = PostMediaModel.tableName;
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;
    const authUserId = authUser.id;
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
    "media"."size",
    "media"."width",
    "media"."height",
    "media"."extension"
    FROM (
      SELECT 
      "p"."id", 
      "p"."comments_count" AS "commentsCount", "p"."views",
      "p"."is_important" AS "isImportant", 
      "p"."important_expired_at" AS "importantExpiredAt", "p"."is_draft" AS "isDraft", "p"."is_article" AS "isArticle",
      "p"."can_comment" AS "canComment", "p"."can_react" AS "canReact", "p"."can_share" AS "canShare", 
      "p"."content", "p"."created_by" AS "createdBy", "p"."updated_by" AS "updatedBy", "p"."created_at" AS 
      "createdAt", "p"."updated_at" AS "updatedAt",
      COALESCE((SELECT true FROM ${schema}.${userMarkReadPostTable} as r 
        WHERE r.post_id = p.id AND r.user_id = :authUserId ), false
      ) AS "markedReadPost",
      CASE WHEN p.privacy = 'PRIVATE' AND COALESCE((SELECT true FROM ${schema}.${postGroupTable} as spg 
        WHERE spg.post_id = p.id AND spg.group_id IN(1, 2, 143, 197) ), false) = FALSE THEN TRUE ELSE FALSE END as "canAccess"
      FROM ${schema}.${postTable} AS "p"
      WHERE "p"."is_draft" = false 
          AND "p"."is_article" = true AND (
          "p"."privacy" != 'SECRET' OR EXISTS(
        SELECT 1
        from ${schema}.${postGroupTable} AS g
        WHERE g.post_id = p.id
        AND g.group_id IN(:groupIds)
      )) ${condition}
      ORDER BY "${orderField}" ${order}
      OFFSET :offset LIMIT :limit
    ) AS "PostModel"
      LEFT JOIN ${schema}.${postGroupTable} AS "groups" ON "PostModel"."id" = "groups"."post_id"
      LEFT OUTER JOIN ( 
        ${schema}.${postMediaTable} AS "media->PostMediaModel" 
        INNER JOIN ${schema}.${mediaTable} AS "media" ON "media"."id" = "media->PostMediaModel"."media_id"
      ) ON "PostModel"."id" = "media->PostMediaModel"."post_id" 
      LEFT OUTER JOIN ${schema}.${mentionTable} AS "mentions" ON "PostModel"."id" = "mentions"."entity_id" AND "mentions"."mentionable_type" = 'post' 
      LEFT OUTER JOIN ${schema}.${postReactionTable} AS "ownerReactions" ON "PostModel"."id" = "ownerReactions"."post_id" AND "ownerReactions"."created_by" = :authUserId
      ORDER BY "PostModel"."${orderField}" ${order}`;
    const rows: any[] = await this.sequelize.query(query, {
      replacements: {
        groupIds,
        offset,
        limit: limit,
        authUserId,
        idGT,
        idGTE,
        idLT,
        idLTE,
        groupId,
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
    let condition = this.getIdConstrains({ idGT, idGTE, idLT, idLTE });
    const { schema } = getDatabaseConfig();
    const postTable = PostModel.tableName;
    const userNewsFeedTable = UserNewsFeedModel.tableName;
    const mentionTable = MentionModel.tableName;
    const postReactionTable = PostReactionModel.tableName;
    const mediaTable = MediaModel.tableName;
    const postMediaTable = PostMediaModel.tableName;
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;
    const postGroupTable = PostGroupModel.tableName;
    let subSelect = `SELECT "p"."id", 
    "p"."comments_count" AS "commentsCount",
    "p"."is_important" AS "isImportant", 
    "p"."important_expired_at" AS "importantExpiredAt", "p"."is_draft" AS "isDraft", 
    "p"."can_comment" AS "canComment", "p"."can_react" AS "canReact", "p"."can_share" AS "canShare", 
    "p"."content", "p"."created_by" AS "createdBy", "p"."updated_by" AS "updatedBy", "p"."created_at" AS 
    "createdAt", "p"."updated_at" AS "updatedAt", "is_seen_post" AS "isSeenPost"`;
    if (isImportant) {
      condition += `AND "p"."is_important" = true AND "p"."important_expired_at" > NOW() AND NOT EXISTS (
        SELECT 1
        FROM ${schema}.${userMarkReadPostTable} as u
        WHERE u.user_id = :authUserId AND u.post_id = p.id
      )`;
      subSelect += `, false AS "markedReadPost"`;
    } else {
      condition += `AND ("p"."important_expired_at" IS NULL OR "p"."important_expired_at" <= NOW() OR EXISTS(
				SELECT 1
				FROM ${schema}.${userMarkReadPostTable} as u
				WHERE u.user_id = :authUserId AND u.post_id = p.id
		  ))`;
      subSelect += `, COALESCE((SELECT true FROM ${schema}.${userMarkReadPostTable} as r 
                                  WHERE r.post_id = p.id AND r.user_id = :authUserId ), false
                      ) AS "markedReadPost"`;
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
    "media"."size",
    "media"."height",
    "media"."extension"
    FROM (
      ${subSelect}
      FROM ${schema}.${postTable} AS "p"
      INNER JOIN ${schema}.${userNewsFeedTable} AS u ON u.post_id = p.id AND u.user_id  = :authUserId
      WHERE "p"."is_draft" = false ${condition}
      ORDER BY "is_seen_post" ASC, "p"."created_at" ${order} 
      OFFSET :offset LIMIT :limit
    ) AS "PostModel"
      LEFT JOIN ${schema}.${postGroupTable} AS "groups" ON "PostModel"."id" = "groups"."post_id"
      LEFT OUTER JOIN ( 
        ${schema}.${postMediaTable} AS "media->PostMediaModel" 
        INNER JOIN ${schema}.${mediaTable} AS "media" ON "media"."id" = "media->PostMediaModel"."media_id"
      ) ON "PostModel"."id" = "media->PostMediaModel"."post_id" 
      LEFT OUTER JOIN ${schema}.${mentionTable} AS "mentions" ON "PostModel"."id" = "mentions"."entity_id" AND "mentions"."mentionable_type" = 'post' 
      LEFT OUTER JOIN ${schema}.${postReactionTable} AS "ownerReactions" ON "PostModel"."id" = "ownerReactions"."post_id" AND "ownerReactions"."created_by" = :authUserId
      ORDER BY "PostModel"."isSeenPost" ASC,"PostModel"."createdAt" ${order}
      `;
    // ORDER BY "isSeenPost" ASC, "PostModel"."createdAt" ${order}

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
    userId: number,
    groupIds: number[],
    constraints: string
  ): Promise<number> {
    const { schema } = getDatabaseConfig();
    const query = `SELECT COUNT(*) as total
    FROM ${schema}.posts as p
    WHERE "p"."is_draft" = false AND "p"."important_expired_at" > NOW()
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
        userId,
      },
      type: QueryTypes.SELECT,
    });
    return result[0].total;
  }

  public static async getTotalImportantPostInNewsFeed(
    userId: number,
    constraints: string
  ): Promise<number> {
    const { schema } = getDatabaseConfig();
    const query = `SELECT COUNT(*) as total
    FROM ${schema}.posts as p
    WHERE "p"."is_draft" = false AND "p"."important_expired_at" > NOW()
    AND NOT EXISTS (
        SELECT 1
        FROM ${schema}.users_mark_read_posts as u
        WHERE u.user_id = :userId AND u.post_id = p.id
      )
    AND EXISTS(
        SELECT 1
        from ${schema}.user_newsfeed AS u
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
