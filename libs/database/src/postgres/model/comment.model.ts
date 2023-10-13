import { IMAGE_RESOURCE, MEDIA_PROCESS_STATUS } from '@beincom/constants';
import { IsUUID } from 'class-validator';
import { DataTypes, InferAttributes, InferCreationAttributes, Sequelize } from 'sequelize';
import {
  AfterCreate,
  AfterDestroy,
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  Default,
  ForeignKey,
  HasMany,
  Length,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { NIL as NIL_UUID, v4 as uuid_v4 } from 'uuid';

import { CommentReactionAttributes, CommentReactionModel } from './comment-reaction.model';
import { PostAttributes, PostModel } from './post.model';

export enum ActionEnum {
  INCREMENT = 'increment',
  DECREMENT = 'decrement',
}

export interface IFile {
  id: string;
  url: string;
  name: string;
  createdBy: string;
  mimeType: string;
  size: number;
}

export interface IImage {
  id: string;
  url: string;
  src?: string;
  createdBy: string;
  mimeType: string;
  resource: IMAGE_RESOURCE;
  width: number;
  height: number;
  status: MEDIA_PROCESS_STATUS;
}

export interface IVideoThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface IVideo {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  createdBy: string;
  size: number;
  width: number;
  height: number;
  status: MEDIA_PROCESS_STATUS;
  thumbnails: IVideoThumbnail[];
}

export interface IMediaJson {
  files: IFile[];
  images: IImage[];
  videos: IVideo[];
}

export type CommentAttributes = InferAttributes<CommentModel>;

@Table({
  tableName: 'comments',
})
export class CommentModel extends Model<CommentAttributes, InferCreationAttributes<CommentModel>> {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @AllowNull(false)
  @ForeignKey(() => CommentModel)
  @IsUUID()
  @Column
  public parentId: string;

  @ForeignKey(() => PostModel)
  @AllowNull(false)
  @IsUUID()
  @Column
  public postId: string;

  @Length({ max: 5000 })
  @Column
  public content: string;

  @Column
  public totalReply?: number;

  @Column
  public createdBy: string;

  @Column
  public edited?: boolean;

  @Column
  public isHidden?: boolean;

  @AllowNull(true)
  @Column
  public giphyId: string;

  @Column
  public updatedBy: string;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;

  @AllowNull(true)
  @Column({
    type: DataTypes.JSONB,
  })
  public mediaJson: IMediaJson;

  @AllowNull(true)
  @Column({
    type: DataTypes.JSONB,
  })
  public mentions: string[];

  @BelongsTo(() => PostModel)
  public post?: PostAttributes;

  @HasMany(() => CommentModel, {
    foreignKey: {
      allowNull: true,
    },
  })
  public child?: CommentModel[];

  @HasMany(() => CommentReactionModel)
  public ownerReactions?: CommentReactionAttributes[];

  @AfterCreate
  public static async onCommentCreated(comment: CommentModel): Promise<void> {
    await CommentModel._updateCommentCountForPost(
      comment.sequelize,
      comment.postId,
      ActionEnum.INCREMENT
    );
    await CommentModel._updateChildCommentCount(comment, ActionEnum.INCREMENT);
  }

  @AfterDestroy
  public static async onCommentDeleted(comment: CommentModel): Promise<void> {
    await CommentModel._updateCommentCountForPost(
      comment.sequelize,
      comment.postId,
      ActionEnum.DECREMENT
    );
    await CommentModel._updateChildCommentCount(comment, ActionEnum.DECREMENT);
  }

  /**
   * Update Child Comment Count
   * @param comment CommentModel
   * @param action ActionEnum
   * @private
   */
  private static async _updateChildCommentCount(
    comment: CommentModel,
    action: ActionEnum
  ): Promise<void> {
    if (comment.parentId !== NIL_UUID) {
      const parentComment = await comment.sequelize
        .model(CommentModel.name)
        .findByPk(comment.parentId);
      await parentComment[action]('totalReply');
    }
  }

  /**
   * Update Comment Count For Post
   * @param sequelize Sequelize
   * @param postId String
   * @param action ActionEnum
   * @private
   */
  private static async _updateCommentCountForPost(
    sequelize: Sequelize,
    postId: string,
    action: ActionEnum
  ): Promise<void> {
    const post = await sequelize.model(PostModel.name).findByPk(postId);
    if (post) {
      await post[action]('comments_count');
    }
  }
}
