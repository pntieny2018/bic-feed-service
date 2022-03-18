import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsToMany,
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
import { CommentMediaModel } from './comment-media.model';
import { ApiProperty } from '@nestjs/swagger';

export type MediaType = 'video' | 'image' | 'file';

export interface IMedia {
  id: number;
  createdBy: number;
  url: string;
  type: MediaType;
  posts: PostModel[];
  comments: CommentModel[];
  createdAt?: Date;
  name: string;
  originName?: string;
  width?: number;
  height?: number;
  extension?: string;
}
@Table({
  tableName: 'media',
  createdAt: false,
  updatedAt: false,
})
export class MediaModel extends Model<IMedia, Optional<IMedia, 'id'>> implements IMedia {
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
  public createdAt: Date;

  @HasMany(() => PostMediaModel)
  public posts: PostModel[];

  @BelongsToMany(() => CommentModel, () => CommentMediaModel)
  public comments: CommentModel[];

  @Column
  public name: string;

  @Column
  public originName?: string;

  @Column
  public width?: number;

  @Column
  public height?: number;

  @Column
  public extension?: string;
}
