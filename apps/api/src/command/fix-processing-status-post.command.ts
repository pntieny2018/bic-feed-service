import { CONTENT_STATUS } from '@beincom/constants';
import { PostModel } from '@libs/database/postgres/model';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';

@Command({ name: 'post:fix-processing-status', description: 'Fix processing status for all posts' })
export class FixProcessingStatusPostCommand implements CommandRunner {
  public constructor(@InjectModel(PostModel) private _postModel: typeof PostModel) {}

  public async run(): Promise<any> {
    try {
      const [count] = await this._postModel.update(
        { status: CONTENT_STATUS.DRAFT },
        {
          where: {
            status: CONTENT_STATUS.PROCESSING,
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
