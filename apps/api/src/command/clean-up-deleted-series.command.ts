import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';
import { Op } from 'sequelize';

import { PostModel, PostType } from '../database/models/post.model';

@Command({ name: 'clean-up:deleted-series', description: 'Clean all deleted series' })
export class CleanUpDeletedSeriesCommand implements CommandRunner {
  private _logger = new Logger(CleanUpDeletedSeriesCommand.name);
  public constructor(
    @InjectModel(PostModel)
    private _postModel: typeof PostModel
  ) {}

  public async run(): Promise<any> {
    try {
      const posts = await this._postModel.findAll({
        where: {
          type: PostType.SERIES,
          deletedAt: {
            [Op.not]: null,
          },
        },
        paranoid: false,
      });
      for (const post of posts) {
        await post.destroy({
          force: true,
        });
      }
      this._logger.log(`Deleted ${posts.length} series. Done`);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
    process.exit();
  }
}
