import { Column, CreatedAt, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { CommentModel } from './comment.model';

export interface ICommentReaction {
  id: number;
  commentId: number;
  reactionName: string;
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
  @Column
  public id: number;

  @ForeignKey(() => CommentModel)
  @Column
  public commentId: number;

  @Column
  public reactionName: string;

  @Column
  public createdBy: number;

  @CreatedAt
  public createdAt: Date;
}
