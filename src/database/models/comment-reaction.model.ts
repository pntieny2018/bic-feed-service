import { AutoIncrement, Column, CreatedAt, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { CommentModel } from './comment.model';
import { MediaModel } from './media.model';

export interface ICommentReaction {
  id: number;
  commentId: number;
  reactionName: string;
  createdBy: number;
  createdAt?: Date;
}
@Table({
  tableName: 'comment_reaction',
  updatedAt: false,
})
export class CommentReactionModel
  extends Model<ICommentReaction, Optional<ICommentReaction, 'id'>>
  implements ICommentReaction
{
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  @ForeignKey(() => CommentModel)
  @Column
  public commentId: number;

  @ForeignKey(() => MediaModel)
  @Column
  public reactionName: string;

  @Column
  public createdBy: number;

  @Column
  @CreatedAt
  public createdAt?: Date;
}
