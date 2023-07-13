import { QueryTypes } from 'sequelize';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { getDatabaseConfig } from '../config/database';
import { Command, CommandRunner } from 'nest-commander';
import { PostModel, PostStatus, PostType } from '../database/models/post.model';

@Command({
  name: 'migrate:scheduled-time-articles',
  description: 'Migration data scheduled time of articles',
})
export class MigrateScheduledTimeArticlesCommand implements CommandRunner {
  private readonly _logger = new Logger(MigrateScheduledTimeArticlesCommand.name);

  public constructor(
    @InjectModel(PostModel)
    private readonly _postModel: typeof PostModel
  ) {}

  public async run(): Promise<any> {
    try {
      const { schema } = getDatabaseConfig();
      const results = await this._postModel.sequelize.query(
        `UPDATE ${schema}.posts SET scheduled_at = published_at 
          WHERE scheduled_at IS NULL AND published_at IS NOT NULL`,
        {
          replacements: {
            type: PostType.ARTICLE,
            status: PostStatus.WAITING_SCHEDULE,
          },
          type: QueryTypes.UPDATE,
        }
      );
      this._logger.log(`UPDATE ${results[1]}, ${results[1]} rows affected`);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
    process.exit();
  }
}
