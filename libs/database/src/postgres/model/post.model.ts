import { CONTENT_STATUS, CONTENT_TYPE, LANGUAGE, PRIVACY } from '@beincom/constants';
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

import { CategoryModel } from './category.model';
import { CommentModel, IMediaJson } from './comment.model';
import { FailedProcessPostModel } from './failed-process-post.model';
import { LinkPreviewModel } from './link-preview.model';
import { MediaModel } from './media.model';
import { PostCategoryModel } from './post-category.model';
import { PostGroupModel } from './post-group.model';
import { PostMediaModel } from './post-media.model';
import { PostReactionModel } from './post-reaction.model';
import { PostSeriesModel } from './post-series.model';
import { PostTagModel } from './post-tag.model';
import { QuizParticipantModel } from './quiz-participant.model';
import { QuizModel } from './quiz.model';
import { TagAttributes, TagModel } from './tag.model';
import { UserNewsFeedModel } from './user-newsfeed.model';
import { UserSavePostModel } from './user-save-post.model';

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
  @Column
  public type: CONTENT_TYPE;

  @AllowNull(true)
  @Column
  public summary: string;

  @AllowNull(true)
  @Column
  public lang?: LANGUAGE;

  @Column
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
  @Column
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
  public mediaJson?: IMediaJson;

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
  public comments?: CommentModel[];

  @BelongsToMany(() => MediaModel, () => PostMediaModel)
  public media?: MediaModel[];

  @BelongsToMany(() => CategoryModel, () => PostCategoryModel)
  public categories?: CategoryModel[];

  @HasMany(() => PostCategoryModel)
  public postCategories?: PostCategoryModel[];

  @BelongsToMany(() => TagModel, () => PostTagModel)
  public tags?: TagModel[];

  @HasMany(() => PostTagModel)
  public postTags?: PostTagModel[];

  @BelongsToMany(() => PostModel, () => PostSeriesModel, 'postId', 'seriesId')
  public series?: PostModel[];

  @HasMany(() => PostSeriesModel, 'postId')
  public postSeries?: PostSeriesModel[];

  @HasMany(() => PostSeriesModel, 'seriesId')
  public itemIds?: PostSeriesModel[];

  @BelongsToMany(() => PostModel, () => PostSeriesModel, 'seriesId')
  public items?: PostModel[];

  @HasOne(() => QuizModel, {
    foreignKey: 'postId',
  })
  public quiz?: QuizModel;

  @HasMany(() => QuizParticipantModel, 'postId')
  public quizResults?: QuizParticipantModel[];

  @HasMany(() => PostGroupModel)
  public groups?: PostGroupModel[];

  @HasMany(() => UserNewsFeedModel)
  public userNewsfeeds?: UserNewsFeedModel[];

  @HasMany(() => PostReactionModel)
  public reactions?: PostReactionModel[];

  @HasMany(() => UserNewsFeedModel)
  public userNewsFeeds?: UserNewsFeedModel[];

  @HasMany(() => UserSavePostModel)
  public userSavePosts?: UserSavePostModel[];

  @BelongsTo(() => LinkPreviewModel, {
    foreignKey: 'linkPreviewId',
  })
  public linkPreview?: LinkPreviewModel;

  @HasMany(() => PostReactionModel, {
    as: 'ownerReactions',
    foreignKey: 'postId',
  })
  public postReactions?: PostReactionModel[];

  public reactionsCount?: string;

  public markedReadPost?: boolean;

  public isSaved?: boolean;

  @BelongsTo(() => MediaModel, {
    foreignKey: 'cover',
  })
  public coverMedia?: MediaModel;

  @HasMany(() => FailedProcessPostModel, {
    as: 'failedPostReasons',
    foreignKey: 'postId',
  })
  public failedPostReasons?: FailedProcessPostModel[];
}
