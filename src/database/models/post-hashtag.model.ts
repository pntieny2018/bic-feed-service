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
import { HashtagModel } from './hashtag.model';
import { PostModel } from './post.model';

export interface IPostHashtag {
  postId: string;
  hashtagId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
@Table({
  tableName: 'posts_hashtags',
  timestamps: false,
})
export class PostHashtagModel extends Model implements IPostHashtag {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @ForeignKey(() => HashtagModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public hashtagId: string;

  @BelongsTo(() => PostModel)
  public post?: PostModel;

  @BelongsTo(() => HashtagModel)
  public hashtag?: HashtagModel;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
