import {
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { PostModel } from './post.model';

export interface IPostGroup {
  postId: number;
  groupId: number;
  createdAt?: Date;
  updatedAt?: Date;
}
@Table({
  tableName: 'posts_groups',
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
  public post?: PostModel;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
