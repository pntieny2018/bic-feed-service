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
import { CategoryModel } from './category.model';
import { PostModel } from './post.model';

export interface IPostCategory {
  postId: string;
  categoryId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
@Table({
  tableName: 'posts_categories',
  timestamps: false,
})
export class PostCategoryModel extends Model implements IPostCategory {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @ForeignKey(() => CategoryModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public categoryId: string;

  @BelongsTo(() => PostModel)
  public post?: PostModel;

  @BelongsTo(() => CategoryModel)
  public category?: CategoryModel;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
