import {
  Column,
  CreatedAt,
  Default,
  HasMany,
  Length,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';
import { IPost, PostModel } from './post.model';
import { PostHashtagModel } from './post-hashtag.model';

export interface IHashtag {
  id: string;
  name: string;
  slug: string;
  createdAt?: Date;
  posts?: IPost[];
}

@Table({
  tableName: 'hashtags',
  updatedAt: false,
})
export class HashtagModel extends Model<IHashtag, Optional<IHashtag, 'id'>> implements IHashtag {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Length({ max: 255 })
  @Column
  public name: string;

  @Length({ max: 255 })
  @Column
  public slug: string;

  @HasMany(() => PostHashtagModel)
  public posts: PostModel[];

  @CreatedAt
  @Column
  public createdAt?: Date;
}
