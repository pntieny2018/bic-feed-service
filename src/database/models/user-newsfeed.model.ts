import { Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { PostModel } from './post.model';

export interface IUserNewsFeed {
  userId: number;
  postId: number;
}
@Table({
  tableName: 'newsfeed',
})
export class UserNewsFeedModel extends Model implements IUserNewsFeed {
  @PrimaryKey
  @Column
  public userId: number;

  @ForeignKey(() => PostModel)
  @PrimaryKey
  @Column
  public postId: number;
}
