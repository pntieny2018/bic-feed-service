import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel, PostType } from '../database/models/post.model';
import { PostService } from '../modules/post/post.service';
import { PostEditedHistoryModel } from '../database/models/post-edited-history.model';

@Command({ name: 'clean-article', description: 'Clean all article' })
export class CleanArticleCommand implements CommandRunner {
  public constructor(
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    @InjectModel(PostEditedHistoryModel) private _postHistoryModel: typeof PostEditedHistoryModel,
    private _postService: PostService
  ) {}

  public async run(): Promise<any> {
    try {
      const posts = await this._postModel.findAll({
        attributes: ['id'],
        where: {
          type: PostType.ARTICLE,
        },
        paranoid: false,
      });
      for (const post of posts) {
        post.destroy({
          force: true,
        });
        console.log(`Deleted ${post.id}`);
      }

      const postIds = posts.map((post) => post.id);

      await this._postHistoryModel.destroy({
        where: {
          postId: postIds,
        },
      });

      console.log(`Deleted ${posts.length} articles. Done`);
    } catch (e) {
      console.log(e);
    }
  }
}
