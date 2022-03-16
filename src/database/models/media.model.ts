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
  isDraft: boolean;
  posts: PostModel[];
  comments: CommentModel[];
  createdAt?: Date;
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
  @ApiProperty()
  public id: number;

  @Column
  @ApiProperty()
  public url: string;

  @Column
  @ApiProperty()
  public type: MediaType;

  @Column
  @ApiProperty()
  public isDraft: boolean;

  @AllowNull(false)
  @Column
  @ApiProperty()
  public createdBy: number;

  @CreatedAt
  @ApiProperty()
  public createdAt: Date;

  @HasMany(() => PostMediaModel)
  @ApiProperty()
  public posts: PostModel[];

  @BelongsToMany(() => CommentModel, () => CommentMediaModel)
  @ApiProperty()
  public comments: CommentModel[];
}
