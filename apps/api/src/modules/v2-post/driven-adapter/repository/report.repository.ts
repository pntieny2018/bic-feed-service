import {
  LibUserReportContentDetailRepository,
  LibUserReportContentRepository,
} from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';

import { ReportEntity } from '../../domain/model/report';
import { IReportRepository } from '../../domain/repositoty-interface/report.repository.interface';
import { ReportMapper } from '../mapper';

@Injectable()
export class ReportRepository implements IReportRepository {
  public constructor(
    private readonly _libReportRepo: LibUserReportContentRepository,
    private readonly _libReportDetailRepo: LibUserReportContentDetailRepository,
    private readonly _reportMapper: ReportMapper
  ) {}

  public async findReportByTargetId(targetId: string): Promise<ReportEntity> {
    const report = await this._libReportRepo.first({ where: { targetId } });
    return this._reportMapper.toDomain(report);
  }

  public async createReport(reportEntity: ReportEntity): Promise<void> {
    const report = this._reportMapper.toPersistence(reportEntity);
    const { details, ...reportData } = report;

    await this._libReportRepo.create(reportData);

    if (details?.length) {
      await this._libReportDetailRepo.bulkCreate(details, { ignoreDuplicates: true });
    }
  }

  public async updateReport(reportEntity: ReportEntity): Promise<void> {
    const report = this._reportMapper.toPersistence(reportEntity);
    const { id, status, details } = report;

    await this._libReportRepo.update({ status }, { where: { id } });

    if (details?.length) {
      await this._libReportDetailRepo.bulkCreate(details, { ignoreDuplicates: true });
    }
  }
}
