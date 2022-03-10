import { Column, ForeignKey, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { MediaModel } from './media.model';
import { PostModel } from './post.model';

export interface IPostReaction {
  id: number;
  postId: number;
  reactionName: string;
}
@Table({
  tableName: 'media',
})
export class PostReactionModel extends Model<IPostReaction, Optional<IPostReaction, 'id'>> implements IPostReaction {
  @PrimaryKey
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
}
