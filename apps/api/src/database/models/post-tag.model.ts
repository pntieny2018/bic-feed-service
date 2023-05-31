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
import { TagModel } from './tag.model';

export interface IPostTag {
  postId: string;
  tagId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
@Table({
  tableName: 'posts_tags',
  timestamps: false,
})
export class PostTagModel extends Model implements IPostTag {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @ForeignKey(() => TagModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public tagId: string;

  @BelongsTo(() => PostModel)
  public post?: PostModel;

  @BelongsTo(() => TagModel)
  public tag?: TagModel;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
