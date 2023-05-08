import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel, PostStatus } from '../database/models/post.model';

@Command({ name: 'post:fix-processing-status', description: 'Fix processing status for all posts' })
export class FixProcessingStatusPostCommand implements CommandRunner {
  public constructor(@InjectModel(PostModel) private _postModel: typeof PostModel) {}

  public async run(): Promise<any> {
    try {
      const [count] = await this._postModel.update(
        { status: PostStatus.DRAFT },
        {
          where: {
            status: PostStatus.PROCESSING,
            totalUsersSeen: 0,
          },
        }
      );
      console.log(`Total ${count}. DONE!`);
    } catch (e) {
      console.log(e);
    }
    process.exit();
  }
}
