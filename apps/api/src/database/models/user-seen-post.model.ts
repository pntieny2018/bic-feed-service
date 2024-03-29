import { IsUUID } from 'class-validator';
import {
  AfterBulkCreate,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { PostModel } from './post.model';
import { ActionEnum } from './comment.model';
import { Sequelize } from 'sequelize';

export interface IUserSeenPost {
  postId: string;
  userId: string;
  createdAt?: Date;
}

@Table({
  tableName: 'users_seen_posts',
  createdAt: true,
  updatedAt: false,
})
export class UserSeenPostModel extends Model implements IUserSeenPost {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @PrimaryKey
  @Column
  public userId: string;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @AfterBulkCreate
  public static async onUserSeenPostCreated(userSeenPosts: UserSeenPostModel[]): Promise<void> {
    const userSeenPost = userSeenPosts[0];
    await UserSeenPostModel._updateTotalUsersSeenForPost(
      userSeenPost.sequelize,
      userSeenPost.postId,
      ActionEnum.INCREMENT
    );
  }

  /**
   * Update Total Users Seen For Post
   * @param sequelize Sequelize
   * @param postId String
   * @param action ActionEnum
   * @private
   */
  private static async _updateTotalUsersSeenForPost(
    sequelize: Sequelize,
    postId: string,
    action: ActionEnum
  ): Promise<void> {
    const post = await sequelize.model(PostModel.name).findByPk(postId);
    if (post) {
      await post[action]('total_users_seen');
    }
  }
}
