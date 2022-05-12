import { IsUUID } from 'class-validator';
import { BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { PostModel } from './post.model';

export interface IPostGroup {
  postId: string;
  groupId: number;
}
@Table({
  tableName: 'posts_groups',
  timestamps: false,
})
export class PostGroupModel extends Model implements IPostGroup {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @PrimaryKey
  @Column
  public groupId: number;

  @BelongsTo(() => PostModel)
  public post?: PostModel;
}
