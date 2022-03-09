import {
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { PostModel } from './post.model';

export interface INewsFeed {
  userId: number;
  postId: number;
}

@Table({
  tableName: 'user_newsfeed',
})
export class NewsFeed extends Model implements INewsFeed {
  @PrimaryKey
  @Column
  public userId: number;

  @ForeignKey(() => PostModel)
  @PrimaryKey
  @Column
  public postId: number;
}
