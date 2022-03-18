import { BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { PostModel } from './post.model';

export interface IPostGroup {
  postId: number;
  groupId: number;
}
@Table({
  tableName: 'post_group',
  timestamps: false,
})
export class PostGroupModel extends Model implements IPostGroup {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @Column
  public postId: number;

  @PrimaryKey
  @Column
  public groupId: number;

  @BelongsTo(() => PostModel)
  public post: PostModel;
}
