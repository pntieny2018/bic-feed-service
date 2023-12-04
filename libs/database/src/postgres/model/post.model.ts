import { CONTENT_STATUS, CONTENT_TYPE, LANGUAGE, PRIVACY } from '@beincom/constants';
import { Media } from '@libs/common/dtos';
import { IsUUID } from 'class-validator';
import { DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
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
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

import { CategoryAttributes, CategoryModel } from './category.model';
import { CommentAttributes, CommentModel } from './comment.model';
import { FailedProcessPostAttributes, FailedProcessPostModel } from './failed-process-post.model';
import { LinkPreviewAttributes, LinkPreviewModel } from './link-preview.model';
import { MediaAttributes, MediaModel } from './media.model';
import { PostCategoryAttributes, PostCategoryModel } from './post-category.model';
import { PostGroupAttributes, PostGroupModel } from './post-group.model';
import { PostReactionAttributes, PostReactionModel } from './post-reaction.model';
import { PostSeriesAttributes, PostSeriesModel } from './post-series.model';
import { PostTagAttributes, PostTagModel } from './post-tag.model';
import { QuizParticipantAttributes, QuizParticipantModel } from './quiz-participant.model';
import { QuizAttributes, QuizModel } from './quiz.model';
import { TagAttributes, TagModel } from './tag.model';
import { UserNewsFeedAttributes, UserNewsFeedModel } from './user-newsfeed.model';
import { UserSavePostAttributes, UserSavePostModel } from './user-save-post.model';

export type PostAttributes = InferAttributes<PostModel>;

@Table({
  tableName: 'posts',
  paranoid: true,
})
export class PostModel extends Model<PostAttributes, InferCreationAttributes<PostModel>> {
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
  public type: CONTENT_TYPE;

  @AllowNull(true)
  @Column
  public summary: string;

  @AllowNull(true)
  @Column({
    type: DataTypes.STRING,
  })
  public lang?: LANGUAGE;

  @Column({
    type: DataTypes.STRING,
  })
  public privacy: PRIVACY;

  @Column({
    type: DataTypes.JSONB,
  })
  public tagsJson: TagAttributes[];

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
  public cover?: string;

  @AllowNull(false)
  @Column({
    type: DataTypes.STRING,
  })
  public status: CONTENT_STATUS;

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
  public errorLog?: any;

  @AllowNull(true)
  @Column({
    type: DataTypes.JSONB,
  })
  public coverJson?: any;

  @AllowNull(true)
  @Column({
    type: DataTypes.JSONB,
  })
  public mediaJson?: Media;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;

  @DeletedAt
  @Column
  public deletedAt?: Date;

  @HasMany(() => CommentModel)
  public comments?: CommentAttributes[];

  @BelongsToMany(() => CategoryModel, () => PostCategoryModel)
  public categories?: CategoryAttributes[];

  @HasMany(() => PostCategoryModel)
  public postCategories?: PostCategoryAttributes[];

  @BelongsToMany(() => TagModel, () => PostTagModel)
  public tags?: TagAttributes[];

  @HasMany(() => PostTagModel)
  public postTags?: PostTagAttributes[];

  @BelongsToMany(() => PostModel, () => PostSeriesModel, 'postId', 'seriesId')
  public series?: PostAttributes[];

  @HasMany(() => PostSeriesModel, 'postId')
  public postSeries?: PostSeriesAttributes[];

  @BelongsToMany(() => PostModel, () => PostSeriesModel, 'seriesId')
  public items?: PostAttributes[];

  @HasOne(() => QuizModel, {
    foreignKey: 'postId',
  })
  public quiz?: QuizAttributes;

  @HasMany(() => QuizParticipantModel, 'postId')
  public quizResults?: QuizParticipantAttributes[];

  @HasMany(() => PostGroupModel)
  public groups?: PostGroupAttributes[];

  @HasMany(() => UserNewsFeedModel)
  public userNewsfeeds?: UserNewsFeedAttributes[];

  @HasMany(() => PostReactionModel)
  public reactions?: PostReactionAttributes[];

  @HasMany(() => UserNewsFeedModel)
  public userNewsFeeds?: UserNewsFeedAttributes[];

  @HasMany(() => UserSavePostModel)
  public userSavePosts?: UserSavePostAttributes[];

  @BelongsTo(() => LinkPreviewModel, {
    foreignKey: 'linkPreviewId',
  })
  public linkPreview?: LinkPreviewAttributes;

  @HasMany(() => PostReactionModel, {
    as: 'ownerReactions',
    foreignKey: 'postId',
  })
  public ownerReactions?: PostReactionModel[];

  public reactionsCount?: string;

  public markedReadPost?: boolean;

  public isSaved?: boolean;

  @BelongsTo(() => MediaModel, {
    foreignKey: 'cover',
  })
  public coverMedia?: MediaAttributes;

  @HasMany(() => FailedProcessPostModel, {
    as: 'failedPostReasons',
    foreignKey: 'postId',
  })
  public failedPostReasons?: FailedProcessPostAttributes[];

  public seriesIds?: string[];
  public itemIds?: string[];
}
