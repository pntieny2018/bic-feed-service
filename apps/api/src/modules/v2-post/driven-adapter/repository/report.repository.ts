import { ORDER } from '@beincom/constants';
import { CursorPaginationResult } from '@libs/database/postgres/common';
import { ReportContentAttribute } from '@libs/database/postgres/model';
import {
  LibUserReportContentDetailRepository,
  LibUserReportContentRepository,
} from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';
import { WhereOptions } from 'sequelize';

import { ReportEntity } from '../../domain/model/report';
import {
  GetPaginationReportProps,
  FindOneReportProps,
  IReportRepository,
} from '../../domain/repositoty-interface/report.repository.interface';
import { ReportMapper } from '../mapper';

@Injectable()
export class ReportRepository implements IReportRepository {
  public constructor(
    private readonly _libReportRepo: LibUserReportContentRepository,
    private readonly _libReportDetailRepo: LibUserReportContentDetailRepository,
    private readonly _reportMapper: ReportMapper
  ) {}

  public async findOne(input: FindOneReportProps): Promise<ReportEntity> {
    const { id, targetId, targetType, authorId, status } = input.where;
    const { details } = input.include || {};

    const condition: WhereOptions<ReportContentAttribute> = {};
    if (id) {
      condition.id = id;
    }
    if (targetId) {
      condition.targetId = targetId;
    }
    if (targetType) {
      condition.targetType = targetType;
    }
    if (authorId) {
      condition.authorId = authorId;
    }
    if (status) {
      condition.status = status;
    }

    const include = [];
    if (details) {
      include.push({
        model: this._libReportDetailRepo.getModel(),
        required: true,
        as: 'details',
      });
    }

    const report = await this._libReportRepo.first({
      where: condition,
      ...(include.length && { include }),
    });
    return this._reportMapper.toDomain(report);
  }

  public async getPagination(
    input: GetPaginationReportProps
  ): Promise<CursorPaginationResult<ReportEntity>> {
    const { limit, before, after, order = ORDER.DESC, column = 'createdAt' } = input;
    const { targetType, authorId, status } = input.where;
    const { details } = input.include || {};

    const condition: WhereOptions<ReportContentAttribute> = {};
    if (targetType) {
      condition.targetType = targetType;
    }
    if (authorId) {
      condition.authorId = authorId;
    }
    if (status) {
      condition.status = status;
    }

    const include = [];
    if (details) {
      include.push({
        model: this._libReportDetailRepo.getModel(),
        required: true,
        as: 'details',
      });
    }

    const { rows, meta } = await this._libReportRepo.cursorPaginate(
      {
        where: condition,
        ...(include.length && { include }),
      },
      { limit, before, after, order, column }
    );
    return {
      rows: rows.map((report) => this._reportMapper.toDomain(report)),
      meta,
    };
  }

  public async create(reportEntity: ReportEntity): Promise<void> {
    const report = this._reportMapper.toPersistence(reportEntity);
    const { details, ...reportData } = report;

    await this._libReportRepo.create(reportData);

    if (details?.length) {
      await this._libReportDetailRepo.bulkCreate(details, { ignoreDuplicates: true });
    }
  }

  public async update(reportEntity: ReportEntity): Promise<void> {
    const report = this._reportMapper.toPersistence(reportEntity);
    const { id, status, details } = report;

    await this._libReportRepo.update({ status }, { where: { id } });

    if (details?.length) {
      await this._libReportDetailRepo.bulkCreate(details, { ignoreDuplicates: true });
    }
  }
}
