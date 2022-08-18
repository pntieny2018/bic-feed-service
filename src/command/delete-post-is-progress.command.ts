import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel } from '../database/models/post.model';
import { Op } from 'sequelize';
import { PostService } from '../modules/post/post.service';

@Command({
  name: 'delete:post:delete-post-is-progress',
  description: 'Delete post have is_progress = true and created before 14/06',
})
export class DeletePostIsProgressCommand implements CommandRunner {
  public constructor(
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    private _postService: PostService
  ) {}

  public async run(): Promise<any> {
    try {
      const deletedPosts = await this._postModel.findAll({
        where: { isProcessing: true, createdAt: { [Op.lt]: '2022-06-14' } },
      });
      console.log('Total post need to delete: ', deletedPosts.length);
      for (const post of deletedPosts) {
        await this._postService.deleteAPostModel(post);
      }
      console.log('Delete post done!');
      process.exit();
    } catch (e) {
      console.log(e);
    }
  }
}
