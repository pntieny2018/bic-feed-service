import { IsUUID } from 'class-validator';
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
  postId: string;
  groupId: string;
  totalPost?: number;
  totalArticle?: number;
  totalSeries?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
@Table({
  tableName: 'posts_groups',
})
export class PostGroupModel extends Model implements IPostGroup {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @PrimaryKey
  @Column
  public groupId: string;

  @BelongsTo(() => PostModel)
  public post?: PostModel;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
