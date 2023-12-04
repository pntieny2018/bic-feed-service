import { ORDER } from '@beincom/constants';
import { CursorPaginationResult } from '@libs/database/postgres/common';
import { ReportContentAttribute } from '@libs/database/postgres/model';
import {
  LibUserReportContentDetailRepository,
  LibUserReportContentRepository,
} from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { uniq } from 'lodash';
import { Sequelize, WhereOptions } from 'sequelize';

import { ReportEntity } from '../../domain/model/report';
import {
  GetPaginationReportProps,
  FindOneReportProps,
  IReportRepository,
} from '../../domain/repositoty-interface';
import { ReportMapper } from '../mapper';

@Injectable()
export class ReportRepository implements IReportRepository {
  public constructor(
    private readonly _libReportRepo: LibUserReportContentRepository,
    private readonly _libReportDetailRepo: LibUserReportContentDetailRepository,
    private readonly _reportMapper: ReportMapper,

    @InjectConnection()
    private readonly _sequelizeConnection: Sequelize
  ) {}

  public async findOne(input: FindOneReportProps): Promise<ReportEntity> {
    const { id, targetId, targetType, targetActorId, status } = input.where;
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
    if (targetActorId) {
      condition.authorId = targetActorId;
    }
    if (status) {
      condition.status = status;
    }

    const include = [];
    if (details) {
      include.push({
        model: this._libReportDetailRepo.getModel(),
        required: false,
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
    const { targetType, targetActorId, status, groupId } = input.where;
    const { details } = input.include || {};

    const condition: WhereOptions<ReportContentAttribute> = {};
    if (targetType) {
      condition.targetType = targetType;
    }
    if (targetActorId) {
      condition.authorId = targetActorId;
    }
    if (status) {
      condition.status = status;
    }
    if (groupId) {
      // TODO: optimize this query
      const reportIds = await this._libReportDetailRepo.findMany({
        where: { groupId: groupId },
        select: ['reportId'],
      });
      condition.id = uniq(reportIds.map((item) => item.reportId));
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
    const transaction = await this._sequelizeConnection.transaction();

    try {
      const report = this._reportMapper.toPersistence(reportEntity);
      const { details, ...reportData } = report;

      await this._libReportRepo.create(reportData, { transaction });

      if (details?.length) {
        await this._libReportDetailRepo.bulkCreate(details, {
          ignoreDuplicates: true,
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public async update(reportEntity: ReportEntity): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();

    try {
      const report = this._reportMapper.toPersistence(reportEntity);
      const { id, status } = report;

      await this._libReportRepo.update(
        { status },
        {
          where: { id },
          transaction,
        }
      );

      const { attachDetails } = reportEntity.getState();
      if (attachDetails?.length) {
        await this._libReportDetailRepo.bulkCreate(attachDetails, {
          ignoreDuplicates: true,
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
