import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { CommentModel } from './comment.model';
import { PostMediaModel } from './post-media.model';
import { PostModel } from './post.model';

export type MediaType = 'video' | 'image' | 'file';

export interface IMedia {
  id: number;
  createdBy: number;
  url: string;
  type: MediaType;
  posts: PostModel[];
  comments: CommentModel[];
  createdAt?: Date;
}
@Table({
  tableName: 'media',
})
export class MediaModel
  extends Model<IMedia, Optional<IMedia, 'id'>>
  implements IMedia
{
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  @Column
  public url: string;

  @Column
  public type: MediaType;

  @AllowNull(false)
  @Column
  public createdBy: number;

  @CreatedAt
  createdAt: Date;

  @HasMany(() => PostMediaModel)
  posts: PostModel[];

  @HasMany(() => PostMediaModel)
  comments: CommentModel[];
}
