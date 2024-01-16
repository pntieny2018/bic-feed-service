import { getDatabaseConfig } from '@libs/database/postgres/config';
import { UserNewsFeedModel } from '@libs/database/postgres/model';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';

@Command({
  name: 'migrate:newsfeed',
})
export class MigrateNewsfeedCommand implements CommandRunner {
  private readonly _logger = new Logger(MigrateNewsfeedCommand.name);

  public constructor(
    @InjectModel(UserNewsFeedModel)
    private _userNewsfeedModel: typeof UserNewsFeedModel
  ) {}

  public async run(): Promise<any> {
    const databaseConfig = getDatabaseConfig();
    const schemaName = databaseConfig.schema;

    try {
      this._logger.log('Start migrate...');

      await this._userNewsfeedModel.sequelize.query(`
        UPDATE ${schemaName}.user_newsfeed t1
              set created_by = t2.created_by, published_at = t2.published_at,
                  type = t2.type,
                  is_important = t2.is_important
              FROM ${schemaName}.posts t2
          WHERE
              t2.id = t1.post_id;
      `);

      await this._userNewsfeedModel.sequelize.query(`
        DELETE FROM ${schemaName}.user_newsfeed t1
              USING ${schemaName}.posts t2
              WHERE t1.post_id = t2.id AND (t2.status != 'PUBLISHED' OR t2.is_hidden = true);
      `);

      this._logger.log('Done');
    } catch (e) {
      this._logger.error(e?.message);
      this._logger.error(JSON.stringify(e?.stack));
    }
    process.exit();
  }
}
