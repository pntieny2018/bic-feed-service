import { CONTENT_STATUS, CONTENT_TYPE } from '@beincom/constants';
import { getDatabaseConfig } from '@libs/database/postgres/config';
import { PostModel } from '@libs/database/postgres/model';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';
import { QueryTypes } from 'sequelize';

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
          WHERE type = :type AND scheduled_at IS NULL AND published_at IS NOT NULL`,
        {
          replacements: {
            type: CONTENT_TYPE.ARTICLE,
          },
          type: QueryTypes.UPDATE,
        }
      );
      this._logger.log(`UPDATE ${results[1]}, ${results[1]} rows affected`);

      const resultSetNull = await this._postModel.sequelize.query(
        `UPDATE ${schema}.posts SET published_at = NULL 
          WHERE type = :type AND (status = :failed OR status = :waiting)`,
        {
          replacements: {
            type: CONTENT_TYPE.ARTICLE,
            failed: CONTENT_STATUS.SCHEDULE_FAILED,
            waiting: CONTENT_STATUS.WAITING_SCHEDULE,
          },
          type: QueryTypes.UPDATE,
        }
      );

      this._logger.log(`UPDATE ${resultSetNull[1]}, ${resultSetNull[1]} rows affected`);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
    process.exit();
  }
}
