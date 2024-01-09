import { CONTENT_STATUS } from '@beincom/constants';
import { PostModel, UserMarkReadPostModel } from '@libs/database/postgres/model';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';

@Command({ name: 'migrate:mark-read-important', description: 'Update privacy for all posts' })
export class MigrateMarkReadImportantPostCommand implements CommandRunner {
  public constructor(
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    @InjectModel(UserMarkReadPostModel)
    private _userReadImportantPostModel: typeof UserMarkReadPostModel
  ) {}

  public async run(): Promise<any> {
    try {
      const posts = await this._postModel.findAll({
        attributes: ['id', 'createdBy'],
        raw: true,
        where: {
          isImportant: true,
          status: CONTENT_STATUS.PUBLISHED,
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
