import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  Column,
  CreatedAt,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

import { CommentModel } from './comment.model';

export type CommentReactionAttributes = InferAttributes<CommentReactionModel>;

@Table({
  tableName: 'comments_reactions',
  updatedAt: false,
  paranoid: false,
})
export class CommentReactionModel extends Model<
  CommentReactionAttributes,
  InferCreationAttributes<CommentReactionModel>
> {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @ForeignKey(() => CommentModel)
  @IsUUID()
  @Column
  public commentId: string;

  @Column
  public reactionName: string;

  @Column
  public createdBy: string;

  @CreatedAt
  public createdAt?: Date;
}
