import {
  AutoIncrement,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { MediaModel } from './media.model';
import { PostModel } from './post.model';

export interface IPostReaction {
  id: number;
  postId?: number;
  reactionName: string;
  createdBy?: number;
  createdAt?: Date;
}
@Table({
  tableName: 'post_reaction',
  updatedAt: false,
})
export class PostReactionModel
  extends Model<IPostReaction, Optional<IPostReaction, 'id'>>
  implements IPostReaction
{
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  @ForeignKey(() => PostModel)
  @Column
  public postId: number;

  @ForeignKey(() => MediaModel)
  @Column
  public reactionName: string;

  @Column
  public createdBy: number;

  @Column
  @CreatedAt
  public createdAt?: Date;
}
