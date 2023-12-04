import { ReasonCount, ReportDetailModel, ReportModel } from '@libs/database/postgres/model';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { uniq } from 'lodash';
import { Command, CommandRunner } from 'nest-commander';

@Command({
  name: 'fix:report-reporters',
  description: 'Fix missing reporterIds in reasonCount of report',
})
export class FixMissingReporterCommand implements CommandRunner {
  private _logger = new Logger(FixMissingReporterCommand.name);

  public constructor(
    @InjectModel(ReportModel)
    private _reportModel: typeof ReportModel,
    @InjectModel(ReportDetailModel)
    private _reportDetailModel: typeof ReportDetailModel
  ) {}

  public async run(): Promise<any> {
    this._logger.log('Start fix missing reporter...');

    try {
      const batch = 100;
      let offset = 0;

      const totalReports = await this._reportModel.count();

      while (true) {
        const reports = await this._reportModel.findAll({
          limit: batch,
          offset,
          paranoid: false,
        });
        if (!reports.length) {
          break;
        }

        offset += batch;

        this._logger.log(`Processing ${offset} of ${totalReports} report...`);

        const reportIds = reports.map((reportContent) => reportContent.id);
        const reportDetails = await this._reportDetailModel.findAll({
          where: { reportId: reportIds },
        });

        const reportDetailMapByReportId = this._arrayToArrayRecord<ReportDetailModel>(
          reportDetails,
          'reportId'
        );

        for (const reportId of Object.keys(reportDetailMapByReportId)) {
          const details = reportDetailMapByReportId[reportId];

          const reasonsCount = this._calculateReasonsCount(details);

          await this._reportModel.update(
            { reasonsCount },
            {
              where: { id: reportId },
            }
          );
        }
      }

      this._logger.log('Done fix missing reporter...');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      this._logger.error(JSON.stringify(e?.stack));
    }
    process.exit();
  }

  private _calculateReasonsCount(reportDetails: ReportDetailModel[]): ReasonCount[] {
    const reasonTypes = uniq(reportDetails.map((detail) => detail.reasonType));

    return reasonTypes.map((reasonType) => {
      const reasonTypeDetails = reportDetails.filter((detail) => detail.reasonType === reasonType);
      const reporterIds = uniq(reasonTypeDetails.map((detail) => detail.reporterId));

      return {
        reasonType,
        total: reasonTypeDetails.length,
        reporterIds,
      };
    });
  }

  private _arrayToArrayRecord<T>(array: T[], key: string): Record<string, T[]> {
    return array.reduce((record, item) => {
      const recordKey = item[key];

      let existedRecordItem = record[recordKey];
      if (!existedRecordItem) {
        existedRecordItem = [item];
      } else {
        existedRecordItem.push(item);
      }

      record[recordKey] = existedRecordItem;
      return record;
    }, {});
  }
}
