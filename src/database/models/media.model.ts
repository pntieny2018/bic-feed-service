import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsToMany,
  Column,
  CreatedAt,
  Default,
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

export enum MediaType {
  VIDEO = 'video',
  IMAGE = 'image',
  FILE = 'file',
}

export interface IMedia {
  id: number;
  createdBy: number;
  url: string;
  type: MediaType;
  isDraft: boolean;
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

  @Column
  @ApiProperty()
  public isDraft: boolean;

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

  @Default(0)
  @Column
  public width?: number;

  @Default(0)
  @Column
  public height?: number;

  @Column
  public extension?: string;
}
