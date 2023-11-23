import { IsUUID } from 'class-validator';
import { DataTypes, Optional } from 'sequelize';
import { Literal } from 'sequelize/types/utils';
import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  Default,
  DeletedAt,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';
import { TargetType } from '../../modules/report-content/contstants';
import { PostLang } from '../../modules/v2-post/data-type';

import { CategoryModel, ICategory } from './category.model';
import { CommentModel, IComment } from './comment.model';
import { FailedProcessPostModel } from './failed-process-post.model';
import { ILinkPreview, LinkPreviewModel } from './link-preview.model';
import { IMedia, MediaModel } from './media.model';
import { PostCategoryModel } from './post-category.model';
import { IPostGroup, PostGroupModel } from './post-group.model';
import { PostMediaModel } from './post-media.model';
import { IPostReaction, PostReactionModel } from './post-reaction.model';
import { PostSeriesModel } from './post-series.model';
import { IPostTag, PostTagModel } from './post-tag.model';
import { IQuizParticipant, QuizParticipantModel } from './quiz-participant.model';
import { IQuiz, QuizModel } from './quiz.model';
import { ReportContentDetailModel } from './report-content-detail.model';
import { ITag, TagModel } from './tag.model';
import { UserMarkReadPostModel } from './user-mark-read-post.model';
import { IUserNewsFeed, UserNewsFeedModel } from './user-newsfeed.model';
import { IUserSavePost, UserSavePostModel } from './user-save-post.model';
import { getDatabaseConfig } from '@libs/database/postgres/config';

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

export enum PostStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  PUBLISHED = 'PUBLISHED',
  WAITING_SCHEDULE = 'WAITING_SCHEDULE',
  SCHEDULE_FAILED = 'SCHEDULE_FAILED',
}

export interface IPost {
  id: string;
  createdBy: string;
  updatedBy: string;
  content: string;
  lang?: PostLang;
  commentsCount: number;
  totalUsersSeen: number;
  isImportant: boolean;
  wordCount?: number;
  importantExpiredAt?: Date;
  canReact: boolean;
  canComment: boolean;
  isReported?: boolean;
  isHidden?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  //
  comments?: IComment[];
  media?: IMedia[];
  groups?: IPostGroup[];
  userNewsfeeds?: IUserNewsFeed[];
  mentionIds?: number[];
  reactionsCount?: string;
  markedReadPost?: boolean;
  isSaved?: boolean;
  type: PostType;
  title?: string;
  summary?: string;
  categories?: ICategory[];
  series?: IPost[];
  tags?: ITag[];
  postTags?: IPostTag[];
  privacy?: PostPrivacy;
  tagsJson?: ITag[];
  linkPreviewId?: string;
  linkPreview?: ILinkPreview;
  cover?: string;
  items?: IPost[];
  userSavePosts?: IUserSavePost[];
  status: PostStatus;
  quiz?: IQuiz;
  quizResults?: IQuizParticipant[];
  publishedAt?: Date;
  scheduledAt?: Date;
  errorLog?: any;
  mediaJson?: any;
  mentions?: string[];
  coverJson?: any;
  videoIdProcessing?: string;
  postSeries?: PostSeriesModel[];
  itemIds?: PostSeriesModel[];
  ownerReactions?: IPostReaction[];
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

  @Column
  public wordCount?: number;

  @Default(false)
  @Column
  public isImportant: boolean;

  @Column
  public importantExpiredAt?: Date;

  @Column
  public canComment: boolean;

  @Column
  public canReact: boolean;

  @Column
  public isHidden: boolean;

  @Column
  public isReported: boolean;

  @AllowNull(true)
  @Column
  public content: string;

  @AllowNull(true)
  @Column
  public title: string;

  @AllowNull(true)
  @Column({
    type: DataTypes.JSONB,
  })
  public mentions: string[];

  @AllowNull(false)
  @Column({
    type: DataTypes.STRING,
  })
  public type: PostType;

  @AllowNull(true)
  @Column
  public summary: string;

  @AllowNull(true)
  @Column({
    type: DataTypes.STRING,
  })
  public lang: PostLang;

  @Column({
    type: DataTypes.STRING,
  })
  public privacy: PostPrivacy;

  @Column({
    type: DataTypes.JSONB,
  })
  public tagsJson: ITag[];

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
  public videoIdProcessing?: string;

  @AllowNull(true)
  @Column
  public cover: string;

  @AllowNull(false)
  @Column({
    type: DataTypes.STRING,
  })
  public status: PostStatus;

  @AllowNull(true)
  @Column
  public publishedAt: Date;

  @AllowNull(true)
  @Column
  public scheduledAt?: Date;

  @AllowNull(true)
  @Column({
    type: DataTypes.JSONB,
  })
  public errorLog: any;

  @AllowNull(true)
  @Column({
    type: DataTypes.JSONB,
  })
  public coverJson: any;

  @AllowNull(true)
  @Column({
    type: DataTypes.JSONB,
  })
  public mediaJson: any;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;

  @DeletedAt
  @Column
  public deletedAt?: Date;

  @HasMany(() => CommentModel)
  public comments?: IComment[];

  @BelongsToMany(() => MediaModel, () => PostMediaModel)
  public media?: MediaModel[];

  @BelongsToMany(() => CategoryModel, () => PostCategoryModel)
  public categories?: ICategory[];

  @HasMany(() => PostCategoryModel)
  public postCategories?: PostCategoryModel[];

  @BelongsToMany(() => TagModel, () => PostTagModel)
  public tags?: TagModel[];

  @HasMany(() => PostTagModel)
  public postTags?: PostTagModel[];

  @BelongsToMany(() => PostModel, () => PostSeriesModel, 'postId', 'seriesId')
  public series?: IPost[];

  @HasMany(() => PostSeriesModel, 'postId')
  public postSeries?: PostSeriesModel[];

  @HasMany(() => PostSeriesModel, 'seriesId')
  public itemIds?: PostSeriesModel[];

  @BelongsToMany(() => PostModel, () => PostSeriesModel, 'seriesId')
  public items?: IPost[];

  @HasOne(() => QuizModel, {
    foreignKey: 'postId',
  })
  public quiz?: IQuiz;

  @HasMany(() => QuizParticipantModel, 'postId')
  public quizResults: IQuizParticipant[];

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
  public ownerReactions: PostReactionModel[];

  public reactionsCount: string;

  public markedReadPost?: boolean;

  public isSaved?: boolean;

  @BelongsTo(() => MediaModel, {
    foreignKey: 'cover',
  })
  public coverMedia: MediaModel;

  @HasMany(() => FailedProcessPostModel, {
    as: 'failedPostReasons',
    foreignKey: 'postId',
  })
  public failedPostReasons?: FailedProcessPostModel[];

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
      return [Sequelize.literal(`"PostModel".is_important`), alias ? alias : 'isImportant'];
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

  public static excludeReportedByUser(userId: string): Literal {
    const { schema } = getDatabaseConfig();
    const reportContentDetailTable = ReportContentDetailModel.tableName;
    return Sequelize.literal(
      `NOT EXISTS ( 
        SELECT target_id FROM ${schema}.${reportContentDetailTable} rp
          WHERE rp.target_id = "PostModel".id AND rp.created_by = ${this.sequelize.escape(userId)}
      )`
    );
  }

  public static filterSavedByUser(userId: string): Literal {
    const { schema } = getDatabaseConfig();
    const userSavePostTable = UserSavePostModel.tableName;
    return Sequelize.literal(
      `EXISTS ( 
          SELECT sp.user_id FROM ${schema}.${userSavePostTable} sp
            WHERE sp.post_id = "PostModel".id AND sp.user_id = ${this.sequelize.escape(userId)}
        )`
    );
  }

  public static filterInNewsfeedUser(userId: string): Literal {
    const { schema } = getDatabaseConfig();
    const userNewsFeedTable = UserNewsFeedModel.tableName;
    return Sequelize.literal(
      `EXISTS ( 
          SELECT nf.user_id FROM  ${schema}.${userNewsFeedTable} nf
            WHERE nf.post_id = "PostModel".id AND nf.user_id = ${this.sequelize.escape(userId)}
        )`
    );
  }

  public static filterInGroupArchivedCondition(groupArchived: boolean): Literal {
    const { schema } = getDatabaseConfig();
    const postGroupTable = PostGroupModel.tableName;
    return Sequelize.literal(
      `EXISTS (
          SELECT g.group_id FROM  ${schema}.${postGroupTable} g
            WHERE g.post_id = "PostModel".id  AND g.is_archived = ${groupArchived}
        )`
    );
  }

  public static notIncludePostsReported(
    userId: string,
    options?: {
      mainTableAlias?: string;
      type?: TargetType[];
    }
  ): Literal {
    if (!userId) {
      return Sequelize.literal(`1 = 1`);
    }
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
      condition += ` AND target_type IN (${type.map((item) => `'${item}'`).join(',')})`;
    }

    return Sequelize.literal(`NOT EXISTS ( 
      SELECT target_id FROM  ${schema}.${reportContentDetailTable} rp
        ${condition}
    )`);
  }
}
