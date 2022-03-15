import { Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { MediaModel } from './media.model';
import { PostModel } from './post.model';

export interface IPostReaction {
  id: number;
  commentId: number;
  reactionName: string;
}
@Table({
  tableName: 'media',
})
export class CommentReactionModel
  extends Model<IPostReaction, Optional<IPostReaction, 'id'>>
  implements IPostReaction
{
  @PrimaryKey
  @Column
  public id: number;

  @ForeignKey(() => PostModel)
  @Column
  public commentId: number;

  @ForeignKey(() => MediaModel)
  @Column
  public reactionName: string;

  @Column
  public createdBy: number;
}
