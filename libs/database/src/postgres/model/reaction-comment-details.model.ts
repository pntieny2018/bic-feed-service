import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  Column,
  CreatedAt,
  Default,
  PrimaryKey,
  Table,
  UpdatedAt,
  Model,
  ForeignKey,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

import { CommentModel } from './comment.model';

export type ReactionCommentDetailsAttributes = InferAttributes<ReactionCommentDetailsModel>;

@Table({
  tableName: 'reaction_comment_details',
  timestamps: false,
})
export class ReactionCommentDetailsModel extends Model<
  ReactionCommentDetailsAttributes,
  InferCreationAttributes<ReactionCommentDetailsModel>
> {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public reactionName: string;

  @ForeignKey(() => CommentModel)
  @IsUUID()
  @Column
  public commentId: string;

  @Column
  public count: number;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;
}
