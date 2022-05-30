import { IsUUID } from 'class-validator';
import {
  Column,
  CreatedAt,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { CommentModel } from './comment.model';
import { v4 as uuid_v4 } from 'uuid';

export interface ICommentReaction {
  id: string;
  commentId: string;
  reactionName: string;
  createdBy: number;
  createdAt?: Date;
}
@Table({
  tableName: 'comments_reactions',
  updatedAt: false,
  paranoid: false,
})
export class CommentReactionModel
  extends Model<ICommentReaction, Optional<ICommentReaction, 'id'>>
  implements ICommentReaction
{
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
  public createdBy: number;

  @CreatedAt
  public createdAt: Date;
}
