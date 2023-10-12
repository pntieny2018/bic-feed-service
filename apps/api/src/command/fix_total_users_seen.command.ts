import { Logger } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel } from '../database/models/post.model';
import { UserSeenPostModel } from '../database/models/user-seen-post.model';
import { ModelHelper } from '../common/helpers/model.helper';

@Command({ name: 'fix:post:total-users-seen', description: 'Fix total users seen for all posts' })
export class FixTotalUsersSeenCommand implements CommandRunner {
  private _logger = new Logger(FixTotalUsersSeenCommand.name);
  public constructor(
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    @InjectModel(UserSeenPostModel) private _userSeenPostModel: typeof UserSeenPostModel
  ) {}

  public async run(): Promise<any> {
    const usersSeenPosts = await ModelHelper.getAllRecursive<UserSeenPostModel>(
      this._userSeenPostModel,
      {}
    );
    const mapUsersSeenPosts = usersSeenPosts.reduce((acc, item) => {
      if (!acc[item.postId]) {
        acc[item.postId] = 0;
      }
      acc[item.postId] += 1;
      return acc;
    }, {});
    const allPosts = await ModelHelper.getAllRecursive<PostModel>(this._postModel, {});
    for (const post of allPosts) {
      await post.update({ totalUsersSeen: mapUsersSeenPosts[post.id] || 0 });
    }
    this._logger.log(`Done. Total: ${allPosts.length}`);
    process.exit();
  }
}
