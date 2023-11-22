import { PostModel } from '@libs/database/postgres/model';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';
import { Op } from 'sequelize';

@Command({ name: 'clean-up:deleted-contents', description: 'Clean all deleted contents' })
export class CleanUpDeletedContentsCommand implements CommandRunner {
  private _logger = new Logger(CleanUpDeletedContentsCommand.name);
  public constructor(
    @InjectModel(PostModel)
    private _postModel: typeof PostModel
  ) {}

  public async run(): Promise<any> {
    this._logger.log('Start clean up deleted content ...');
    try {
      const number = await this._postModel.destroy({
        where: { deletedAt: { [Op.not]: null } },
        force: true,
        logging: true,
      });
      this._logger.log(`Deleted ${number} contents`);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
    process.exit();
  }
}
