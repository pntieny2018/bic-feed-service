import { IsUUID } from 'class-validator';
import { BelongsToManyAddAssociationsMixin, DataTypes, Optional, QueryTypes } from 'sequelize';
import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  Default,
  DeletedAt,
  HasMany,
  Model,
  PrimaryKey,
  Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Literal } from 'sequelize/types/utils';
import { v4 as uuid_v4 } from 'uuid';
import { MentionableType } from '../../common/constants';
import { StringHelper } from '../../common/helpers';
import { getDatabaseConfig } from '../../config/database';
import { HashtagResponseDto } from '../../modules/hashtag/dto/responses/hashtag-response.dto';
import { TargetType } from '../../modules/report-content/contstants';
import { TagResponseDto } from '../../modules/tag/dto/responses/tag-response.dto';
import { CategoryModel, ICategory } from './category.model';
import { CommentModel, IComment } from './comment.model';
import { HashtagModel, IHashtag } from './hashtag.model';
import { ILinkPreview, LinkPreviewModel } from './link-preview.model';
import { IMedia, MediaModel } from './media.model';
import { IMention, MentionModel } from './mention.model';
import { PostCategoryModel } from './post-category.model';
import { IPostGroup, PostGroupModel } from './post-group.model';
import { PostHashtagModel } from './post-hashtag.model';
import { PostMediaModel } from './post-media.model';
import { PostReactionModel } from './post-reaction.model';
import { PostSeriesModel } from './post-series.model';
import { PostTagModel } from './post-tag.model';
import { ReportContentDetailModel } from './report-content-detail.model';
import { ITag, TagModel } from './tag.model';
import { UserMarkReadPostModel } from './user-mark-read-post.model';
import { IUserNewsFeed, UserNewsFeedModel } from './user-newsfeed.model';
import { IUserSavePost, UserSavePostModel } from './user-save-post.model';

export enum PostPrivacy {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PRIVATE = 'PRIVATE',
  SECRET = 'SECRET',
}

export enum PostType {
  POST = 'POST',
  ARTICLE = 'ARTICLE',
  SERIES = 'SERIES',
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
  type: PostType;
  title?: string;
  summary?: string;
  views: number;
  categories?: ICategory[];
  series?: IPost[];
  hashtags?: IHashtag[];
  tags?: ITag[];
  privacy?: PostPrivacy;
  hashtagsJson?: HashtagResponseDto[];
  tagsJson?: HashtagResponseDto[];
  linkPreviewId?: string;
  linkPreview?: ILinkPreview;
  cover?: string;
  articles?: Partial<IPost>[];
  userSavePosts?: IUserSavePost[];
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

  @AllowNull(true)
  @Column
  public content: string;

  @AllowNull(true)
  @Column
  public title: string;

  @AllowNull(false)
  @Column
  public type: PostType;

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

  @Column({
    type: DataTypes.JSONB,
  })
  public tagsJson: TagResponseDto[];

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

  @BelongsToMany(() => TagModel, () => PostTagModel)
  public tags?: TagModel[];

  @HasMany(() => PostTagModel)
  public postTags?: PostTagModel[];

  @BelongsToMany(() => PostModel, () => PostSeriesModel, 'postId', 'seriesId')
  public series?: PostModel[];

  @HasMany(() => PostSeriesModel)
  public postSeries?: PostSeriesModel[];

  @BelongsToMany(() => PostModel, () => PostSeriesModel, 'seriesId')
  public articles?: PostModel[];

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

  @HasMany(() => UserSavePostModel)
  public userSavePosts?: UserSavePostModel[];

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

  public static loadSaved(authUserId: string, alias?: string): [Literal, string] {
    const { schema } = getDatabaseConfig();
    const userSavePostTable = UserSavePostModel.tableName;
    if (!authUserId) {
      return [Sequelize.literal(`(false)`), alias ? alias : 'isSaved'];
    }
    return [
      Sequelize.literal(`(
        COALESCE((SELECT true FROM ${schema}.${userSavePostTable} as r
          WHERE r.post_id = "PostModel".id AND r.user_id = ${this.sequelize.escape(
            authUserId
          )}), false)
               )`),
      alias ? alias : 'isSaved',
    ];
  }

  public static loadImportant(authUserId: string, alias?: string): [Literal, string] {
    const { schema } = getDatabaseConfig();
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;
    if (!authUserId) {
      return [Sequelize.literal(`(false)`), alias ? alias : 'isImportant'];
    }
    return [
      Sequelize.literal(`(
        CASE WHEN is_important = TRUE AND COALESCE((SELECT TRUE FROM ${schema}.${userMarkReadPostTable} as r
          WHERE r.post_id = "PostModel".id AND r.user_id = ${this.sequelize.escape(
            authUserId
          )}), FALSE) = FALSE THEN 1 ELSE 0 END
               )`),
      alias ? alias : 'isImportant',
    ];
  }

  public static loadContent(alias?: string): [Literal, string] {
    return [
      Sequelize.literal(`(CASE WHEN type = ARTICLE THEN content ELSE null END)`),
      alias ? alias : 'content',
    ];
  }
  public static notIncludePostsReported(
    userId: string,
    options?: {
      mainTableAlias?: string;
      type?: TargetType[];
    }
  ): Literal {
    //TODO limit scope in group
    const { mainTableAlias, type } = options ?? {
      mainTableAlias: 'PostModel',
      type: [],
    };
    const { schema } = getDatabaseConfig();
    const reportContentDetailTable = ReportContentDetailModel.tableName;
    let condition = `WHERE rp.target_id = ${mainTableAlias}.id AND rp.created_by = ${this.sequelize.escape(
      userId
    )}`;

    if (type.length) {
      condition += ` AND target_type IN (${type.join(',')})`;
    }

    return Sequelize.literal(`NOT EXISTS ( 
      SELECT target_id FROM  ${schema}.${reportContentDetailTable} rp
        ${condition}
    )`);
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

  public static async getTotalImportantPostInGroups(groupIds: string[]): Promise<number> {
    const { schema } = getDatabaseConfig();
    const query = `SELECT COUNT(*) as total
    FROM ${schema}.posts as p
    WHERE "p"."deleted_at" IS NULL AND "p"."is_draft" = false AND "p"."important_expired_at" > NOW()
    AND EXISTS(
        SELECT 1
        from ${schema}.posts_groups AS g
        WHERE g.post_id = p.id
        AND g.group_id IN(:groupIds)
      )`;
    const result: any = await this.sequelize.query(query, {
      replacements: {
        groupIds,
      },
      type: QueryTypes.SELECT,
    });
    return result[0].total;
  }
}
