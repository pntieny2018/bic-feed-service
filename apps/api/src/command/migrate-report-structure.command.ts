import {
  REPORT_SCOPE,
  REPORT_STATUS,
  ReasonCount,
  ReportAttribute,
  ReportContentDetailModel,
  ReportContentModel,
  ReportDetailAttributes,
  ReportDetailModel,
  ReportModel,
} from '@libs/database/postgres/model';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { uniq } from 'lodash';
import { Command, CommandRunner } from 'nest-commander';
import { v4 as uuidv4 } from 'uuid';

@Command({
  name: 'migrate:report-structure',
  description: 'Migration report and report detail data following new structure',
})
export class MigrateReportStructure implements CommandRunner {
  private _logger = new Logger(MigrateReportStructure.name);

  public constructor(
    @InjectModel(ReportModel)
    private _reportModel: typeof ReportModel,
    @InjectModel(ReportDetailModel)
    private _reportDetailModel: typeof ReportDetailModel,
    @InjectModel(ReportContentModel)
    private _reportContentModel: typeof ReportContentModel,
    @InjectModel(ReportContentDetailModel)
    private _reportContentDetailModel: typeof ReportContentDetailModel
  ) {}

  public async run(): Promise<any> {
    this._logger.log('Start migrate report structure...');

    try {
      const batch = 10;
      let offset = 0;

      const totalReports = await this._reportContentModel.count();

      while (true) {
        const reports = await this._reportContentModel.findAll({
          limit: batch,
          offset,
          paranoid: false,
        });
        if (!reports.length) {
          break;
        }

        offset += batch;

        this._logger.log(`Processing ${offset} of ${totalReports} report contents...`);

        const reportIds = reports.map((reportContent) => reportContent.id);
        const reportDetails = await this._reportContentDetailModel.findAll({
          where: { reportId: reportIds },
        });

        await this._createReportData(reports, reportDetails);
        await this._createReportDetails(reportDetails);
      }

      this._logger.log('Done migrate report structure');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      this._logger.error(JSON.stringify(e?.stack));
    }
    process.exit();
  }

  private async _createReportData(
    reports: ReportContentModel[],
    reportDetails: ReportContentDetailModel[]
  ): Promise<void> {
    const reportMapById = this._arrayToRecord<ReportContentModel>(reports, 'id');
    const reportDetailMapByReportId = this._arrayToArrayRecord<ReportContentDetailModel>(
      reportDetails,
      'reportId'
    );

    const reportData: ReportAttribute[] = [];

    for (const reportId of Object.keys(reportDetailMapByReportId)) {
      const report = reportMapById[reportId];
      const reportDetails = reportDetailMapByReportId[reportId];

      const groupIds = uniq(reportDetails.map((detail) => detail.groupId));
      const newReports: ReportAttribute[] = groupIds.map((groupId, index) => {
        const reasonsCount = this._calculateReasonsCount(
          reportDetails.filter((detail) => detail.groupId === groupId)
        );
        return {
          id: index === 0 ? reportId : uuidv4(),
          groupId,
          reportTo: REPORT_SCOPE.COMMUNITY,
          targetId: reportDetails[0].targetId,
          targetType: reportDetails[0].targetType,
          targetActorId: report.authorId,
          reasonsCount,
          status: report.status,
          processedBy: report.status !== REPORT_STATUS.CREATED ? report.updatedBy : null,
          processedAt: report.status !== REPORT_STATUS.CREATED ? report.updatedAt : null,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        };
      });

      reportData.push(...newReports);
    }

    const insertReportData = reportData.map((report) => {
      const reasonsCount = `'${JSON.stringify(report.reasonsCount)}'::jsonb`;
      const processedBy = report.processedBy ? `'${report.processedBy}'` : null;
      const processedAt = report.processedAt
        ? `'${report.processedAt.toISOString()}'::timestamp`
        : null;
      const createdAt = `'${report.createdAt.toISOString()}'::timestamp`;
      const updatedAt = report.updatedAt ? `'${report.updatedAt.toISOString()}'::timestamp` : null;

      return `('${report.id}', '${report.groupId}', '${report.reportTo}', '${report.targetId}', '${report.targetType}', '${report.targetActorId}', ${reasonsCount}, '${report.status}', ${processedBy}, ${processedAt}, ${createdAt}, ${updatedAt})`;
    });

    const [, affectedCount] = await this._reportModel.sequelize.query(
      `INSERT INTO ${this._reportModel.getTableName()} ("id", "group_id", "report_to", "target_id", "target_type", "target_actor_id", "reasons_count", "status", "processed_by", "processed_at", "created_at", "updated_at") VALUES ${insertReportData.join(
        `,`
      )};`
    );
    this._logger.log(`Created ${affectedCount} reports`);
  }

  private async _createReportDetails(reportDetails: ReportContentDetailModel[]): Promise<void> {
    const targetIds = uniq(reportDetails.map((detail) => detail.targetId));
    const reports = await this._reportModel.findAll({ where: { targetId: targetIds } });

    const reportMapByTargetId = this._arrayToArrayRecord<ReportModel>(reports, 'targetId');
    const reportDetailMapByTargetId = this._arrayToArrayRecord<ReportContentDetailModel>(
      reportDetails,
      'targetId'
    );

    const reportDetailData: ReportDetailAttributes[] = [];

    for (const targetId of Object.keys(reportMapByTargetId)) {
      const reports = reportMapByTargetId[targetId];
      const oldReportDetails = reportDetailMapByTargetId[targetId];

      const newReportDetails: ReportDetailAttributes[] = reports
        .map((report) => {
          return oldReportDetails
            .filter((detail) => detail.groupId === report.groupId)
            .map((detail) => {
              return {
                id: uuidv4(),
                reportId: report.id,
                targetId: report.targetId,
                reporterId: detail.createdBy,
                reasonType: detail.reasonType,
                reason: detail.reason,
                createdAt: detail.createdAt,
                updatedAt: detail.updatedAt,
              };
            });
        })
        .flat();

      reportDetailData.push(...newReportDetails);
    }

    const insertReportDetailData = reportDetailData.map((detail) => {
      const reason = detail.reason ? `'${detail.reason}'` : null;
      const createdAt = `'${detail.createdAt.toISOString()}'::timestamp`;
      const updatedAt = detail.updatedAt ? `'${detail.updatedAt.toISOString()}'::timestamp` : null;

      return `('${detail.id}', '${detail.reportId}', '${detail.targetId}', '${detail.reporterId}', '${detail.reasonType}', ${reason}, ${createdAt}, ${updatedAt})`;
    });

    const [, affectedCount] = await this._reportDetailModel.sequelize.query(
      `INSERT INTO ${this._reportDetailModel.getTableName()} ("id", "report_id", "target_id", "reporter_id", "reason_type", "reason", "created_at", "updated_at") VALUES ${insertReportDetailData.join(
        `,`
      )};`
    );
    this._logger.log(`Created ${affectedCount} report details`);
  }

  private _calculateReasonsCount(reportDetails: ReportContentDetailModel[]): ReasonCount[] {
    const reasonTypes = uniq(reportDetails.map((detail) => detail.reasonType));

    return reasonTypes.map((reasonType) => {
      const reasonTypeDetails = reportDetails.filter((detail) => detail.reasonType === reasonType);
      const reporterIds = uniq(reasonTypeDetails.map((detail) => detail.createdBy));

      return {
        reasonType,
        total: reasonTypeDetails.length,
        reporterIds,
      };
    });
  }

  private _arrayToRecord<T>(array: T[], key: string): Record<string, T> {
    return array.reduce((record, item) => {
      const recordKey = item[key];

      record[recordKey] = item;
      return record;
    }, {});
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
