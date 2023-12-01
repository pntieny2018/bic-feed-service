import { QueryTypes } from 'sequelize';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';
import { PostModel, PostStatus } from '../database/models/post.model';
import { getDatabaseConfig } from '@libs/database/postgres/config';

@Command({
  name: 'migrate:published-time-content',
  description: 'Migration data published time of content',
})
export class MigratePublishedTimeContentCommand implements CommandRunner {
  private readonly _logger = new Logger(MigratePublishedTimeContentCommand.name);

  public constructor(
    @InjectModel(PostModel)
    private readonly _postModel: typeof PostModel
  ) {}

  public async run(): Promise<any> {
    try {
      const { schema } = getDatabaseConfig();
      const results = await this._postModel.sequelize.query(
        `UPDATE ${schema}.posts SET published_at = created_at 
          WHERE status = :status`,
        {
          replacements: {
            status: PostStatus.PUBLISHED,
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
