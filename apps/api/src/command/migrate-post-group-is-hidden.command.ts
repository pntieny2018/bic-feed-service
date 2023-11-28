import { PostGroupModel, PostModel } from '@libs/database/postgres/model';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';
import { QueryTypes } from 'sequelize';

@Command({
  name: 'migrate:post-group-is-hidden',
  description: 'Migration data for post_group is_hidden',
})
export class MigratePostGroupIsHidden implements CommandRunner {
  private _logger = new Logger(MigratePostGroupIsHidden.name);

  public constructor(
    @InjectModel(PostModel)
    private _postModel: typeof PostModel,
    @InjectModel(PostGroupModel)
    private _postGroupModel: typeof PostGroupModel
  ) {}

  public async run(): Promise<any> {
    this._logger.log('Start migrate post_group is_hidden...');

    try {
      // Reset all post_group is_hidden to false
      const [, affectedCount] = await this._postGroupModel.sequelize.query(
        `UPDATE ${this._postGroupModel.getTableName()} SET is_hidden = false WHERE is_hidden = true;`,
        { type: QueryTypes.UPDATE }
      );
      this._logger.log(`Reset ${affectedCount} post_group is_hidden to false`);

      // Migrate post_group is_hidden
      await this._migratePostGroupIsHidden();
      this._logger.log('Done migrate post_group is_hidden');
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
    process.exit();
  }

  private async _migratePostGroupIsHidden(): Promise<void> {
    const batch = 1000;
    let offset = 0;

    const totalHiddenContents = await this._postModel.count({ where: { isHidden: true } });

    while (true) {
      const hiddenContents = await this._postModel.findAll({
        where: { isHidden: true },
        attributes: ['id'],
        limit: batch,
        offset,
        paranoid: false,
      });
      if (!hiddenContents.length) {
        break;
      }

      offset += batch;

      this._logger.log(`Processing ${offset} of ${totalHiddenContents} hidden contents...`);
      this._logger.log(`Found ${hiddenContents.length} hidden contents. Updating...`);

      const contentIds = hiddenContents.map((content) => content.id);
      const [, affectedCount] = await this._postGroupModel.sequelize.query(
        `UPDATE ${this._postGroupModel.getTableName()} SET is_hidden = true WHERE post_id IN (:contentIds);`,
        { replacements: { contentIds }, type: QueryTypes.UPDATE }
      );
      this._logger.log(`Updated ${affectedCount} post_group is_hidden to true`);
    }
  }
}
