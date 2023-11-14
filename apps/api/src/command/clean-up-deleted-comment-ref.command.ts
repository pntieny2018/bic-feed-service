import {
  CommentModel,
  ReactionCommentDetailsModel,
  ReportContentModel,
} from '@libs/database/postgres/model';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';

@Command({ name: 'clean-up:deleted-comment-ref', description: 'Clean all deleted comment ref' })
export class CleanUpDeletedCommentRefCommand implements CommandRunner {
  private _logger = new Logger(CleanUpDeletedCommentRefCommand.name);
  public constructor(
    @InjectModel(CommentModel)
    private _commentModel: typeof CommentModel,
    @InjectModel(ReactionCommentDetailsModel)
    private _reactionCommentDetailsModel: typeof ReactionCommentDetailsModel,
    @InjectModel(ReportContentModel)
    private _reportContentModel: typeof ReportContentModel
  ) {}

  public async run(): Promise<any> {
    this._logger.log('Start clean up deleted comment ref...');
    try {
      await this._deleteReportComments();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
    process.exit();
  }

  private async _deleteReportComments(): Promise<void> {
    const batch = 1000;
    let offset = 0;

    const total = await this._reportContentModel.count();

    while (true) {
      const reports = await this._reportContentModel.findAll({
        where: { targetType: 'COMMENT' },
        limit: batch,
        offset,
        paranoid: false,
      });
      if (!reports.length) {
        break;
      }

      offset += batch;

      const commentIds = reports.map((report) => report.targetId);
      const existedCommentIds = (
        await this._commentModel.findAll({ where: { id: commentIds }, attributes: ['id'] })
      ).map((comment) => comment.id);
      const deletedCommentIds = commentIds.filter(
        (commentId) => !existedCommentIds.includes(commentId)
      );

      this._logger.log(`Processing ${offset} of ${total} reports...`);
      this._logger.log(`Found ${deletedCommentIds.length} deleted comments. Deleting...`);
      if (deletedCommentIds.length) {
        const totalDeleted = await this._reportContentModel.destroy({
          where: { targetId: deletedCommentIds },
        });
        this._logger.log(`Deleted ${totalDeleted} reports. Done`);
      }
    }
  }
}
