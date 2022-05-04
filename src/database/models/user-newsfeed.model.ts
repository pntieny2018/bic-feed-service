import { BelongsTo, Column, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { PostModel } from './post.model';
export interface IUserNewsFeed {
  userId: number;
  postId: number;
}
@Table({
  tableName: 'user_newsfeed',
  updatedAt: false,
})
export class UserNewsFeedModel extends Model implements IUserNewsFeed {
  @PrimaryKey
  @Column
  public userId: number;

  @ForeignKey(() => PostModel)
  @PrimaryKey
  @Column
  public postId: number;

  @Default(false)
  @Column
  public isSeenPost: boolean;

  @BelongsTo(() => PostModel)
  public postModel: PostModel;
}
