import {
  PostModel,
  ReactionContentDetailsModel,
  ReportContentModel,
} from '@libs/database/postgres/model';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';

@Command({ name: 'clean-up:deleted-content-ref', description: 'Clean all deleted content ref' })
export class CleanUpDeletedContentRefCommand implements CommandRunner {
  private _logger = new Logger(CleanUpDeletedContentRefCommand.name);
  public constructor(
    @InjectModel(PostModel)
    private _postModel: typeof PostModel,
    @InjectModel(ReactionContentDetailsModel)
    private _reactionContentDetailsModel: typeof ReactionContentDetailsModel,
    @InjectModel(ReportContentModel)
    private _reportContentModel: typeof ReportContentModel
  ) {}

  public async run(): Promise<any> {
    this._logger.log('Start clean up deleted content ref...');
    try {
      await this._deleteReportContents();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
    process.exit();
  }

  private async _deleteReportContents(): Promise<void> {
    const batch = 1000;
    let offset = 0;

    const total = await this._reportContentModel.count();

    while (true) {
      const reports = await this._reportContentModel.findAll({
        where: { targetType: ['POST', 'ARTICLE'] },
        limit: batch,
        offset,
        paranoid: false,
      });
      if (!reports.length) {
        break;
      }

      offset += batch;

      const contentIds = reports.map((report) => report.targetId);
      const existedContentIds = (
        await this._postModel.findAll({ where: { id: contentIds }, attributes: ['id'] })
      ).map((content) => content.id);
      const deletedContentIds = contentIds.filter(
        (contentId) => !existedContentIds.includes(contentId)
      );

      this._logger.log(`Processing ${offset} of ${total} reports...`);
      this._logger.log(`Found ${deletedContentIds.length} deleted contents. Deleting...`);
      if (deletedContentIds.length) {
        const totalDeleted = await this._reportContentModel.destroy({
          where: { targetId: deletedContentIds },
        });
        this._logger.log(`Deleted ${totalDeleted} reports. Done`);
      }
    }
  }
}
