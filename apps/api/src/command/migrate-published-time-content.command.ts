import { CONTENT_STATUS } from '@beincom/constants';
import { getDatabaseConfig } from '@libs/database/postgres/config';
import { PostModel } from '@libs/database/postgres/model';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';
import { QueryTypes } from 'sequelize';

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
            status: CONTENT_STATUS.PUBLISHED,
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
