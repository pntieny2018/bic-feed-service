import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel } from '@libs/database/postgres/model';
import { CONTENT_TYPE } from '@beincom/constants';
import { StringHelper } from '@libs/common/helpers';

@Command({ name: 'migrate:post-title' })
export class MigratePostTitleCommand implements CommandRunner {
  public constructor(@InjectModel(PostModel) private _postModel: typeof PostModel) {}

  public async run(): Promise<any> {
    let offset = 0;
    const limit = 1;
    console.log(`Updating...`);
    let count = 0;
    while (true) {
      try {
        const posts = await this._postModel.findAll({
          where: {
            type: CONTENT_TYPE.POST,
          },
          limit: limit,
          offset: offset,
          order: [['createdAt', 'DESC']],
        });

        if (!posts || posts.length === 0) {
          break;
        }

        for (const post of posts) {
          const title = StringHelper.getRawTextFromMarkdown(post.content).slice(0, 500);
          await post.update({ title });
          count++;
        }

        offset += limit;
      } catch (e) {}

      console.log(`Updated ${count} posts. DONE!`);
      process.exit();
    }
  }
}
