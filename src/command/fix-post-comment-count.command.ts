import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { CommentModel } from '../database/models/comment.model';
import { PostModel } from '../database/models/post.model';

@Command({ name: 'fix:post:comment:count', description: 'Fix post comment count' })
export class FixPostCommentCountCommand implements CommandRunner {
  public constructor(
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    @InjectModel(CommentModel) private _commentModel: typeof CommentModel
  ) {}

  public async run(): Promise<any> {
    let offset = 0;
    const limit = 1;
    while (true) {
      try {
        const posts = await this._postModel.findAll({
          limit: limit,
          offset: offset,
          order: [['createdAt', 'DESC']],
        });

        if (!posts || posts.length === 0) {
          break;
        }

        const total = await this._commentModel.count({
          where: {
            postId: posts[0].id,
          },
        });

        await posts[0].update({
          commentsCount: total,
        });
        console.log(`update post comment count of ${posts[0].id} : ${total}`);
        offset += limit;
      } catch (e) {}
    }
  }
}
