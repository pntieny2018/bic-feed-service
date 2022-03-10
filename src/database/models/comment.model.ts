import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  HasMany,
  Length,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { PostModel } from './post.model';
import { Optional } from 'sequelize';
import { MediaModel } from './media.model';
import { CommentMediaModel } from './comment-media.model';

export interface IComment {
  id: number;
  postId: number;
  parentId?: number;
  content?: string;
  createdBy: number;
  updatedBy: number;
  createdAt?: Date;
  updatedAt?: Date;
  post: PostModel;
  media: CommentMediaModel[];
}

@Table({
  tableName: 'comments',
})
export class CommentModel extends Model<IComment, Optional<IComment, 'id'>> implements IComment {
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  @Column
  public parentId: number;

  @ForeignKey(() => PostModel)
  @AllowNull(false)
  @Column
  public postId: number;

  @Length({ max: 5000 })
  @Column
  public content: string;

  @AllowNull(false)
  @Column
  public createdBy: number;

  @AllowNull(false)
  @Column
  public updatedBy: number;

  @CreatedAt
  public createdAt?: Date;

  @UpdatedAt
  public updatedAt?: Date;

  @BelongsTo(() => PostModel)
  public post: PostModel;

  @HasMany(() => CommentMediaModel)
  public media: CommentMediaModel[];
}
