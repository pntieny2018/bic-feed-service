import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel, PostStatus } from '../database/models/post.model';
import { PostService } from '../modules/post/post.service';
import { UserMarkReadPostModel } from '../database/models/user-mark-read-post.model';

@Command({ name: 'migrate:mark-read-important', description: 'Update privacy for all posts' })
export class MigrateMarkReadImportantPostCommand implements CommandRunner {
  public constructor(
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    @InjectModel(UserMarkReadPostModel)
    private _userReadImportantPostModel: typeof UserMarkReadPostModel,
    private _postService: PostService
  ) {}

  public async run(): Promise<any> {
    try {
      const posts = await this._postModel.findAll({
        attributes: ['id', 'createdBy'],
        raw: true,
        where: {
          isImportant: true,
          status: PostStatus.PUBLISHED,
        },
      });
      for (const post of posts) {
        await this._userReadImportantPostModel.bulkCreate(
          [
            {
              postId: post.id,
              userId: post.createdBy,
            },
          ],
          { ignoreDuplicates: true }
        );
        console.log(`Updated ${post.id}`);
      }
      console.log(`Total ${posts.length}. DONE!`);
    } catch (e) {
      console.log(e);
    }
    process.exit();
  }
}
