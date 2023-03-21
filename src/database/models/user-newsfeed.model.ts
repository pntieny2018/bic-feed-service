import { IsUUID } from 'class-validator';
import {
  BelongsTo,
  Column,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { PostModel } from './post.model';

export interface IUserNewsFeed {
  userId: string;
  postId: string;
}
@Table({
  tableName: 'user_newsfeed',
  updatedAt: false,
})
export class UserNewsFeedModel extends Model implements IUserNewsFeed {
  @PrimaryKey
  @Column
  public userId: string;

  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @Default(false)
  @Column
  public isSeenPost: boolean;

  @BelongsTo(() => PostModel)
  public postModel: PostModel;
}
