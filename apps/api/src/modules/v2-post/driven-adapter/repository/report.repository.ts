import { ORDER } from '@beincom/constants';
import { CursorPaginationResult } from '@libs/database/postgres/common';
import { ReportAttribute } from '@libs/database/postgres/model';
import { LibReportDetailRepository, LibReportRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize, WhereOptions, Op } from 'sequelize';

import { ReportEntity } from '../../domain/model/report';
import {
  GetPaginationReportProps,
  IReportRepository,
  FindOneReportProps,
  FindAllReportsProps,
} from '../../domain/repositoty-interface';
import { ReportMapper } from '../mapper';

@Injectable()
export class ReportRepository implements IReportRepository {
  public constructor(
    private readonly _libReportRepo: LibReportRepository,
    private readonly _libReportDetailRepo: LibReportDetailRepository,
    private readonly _reportMapper: ReportMapper,

    @InjectConnection()
    private readonly _sequelizeConnection: Sequelize
  ) {}

  public async findOne(input: FindOneReportProps): Promise<ReportEntity> {
    const { id, groupId, targetId, targetType, targetActorId, isProcessed } = input;

    const condition: WhereOptions<ReportAttribute> = {};
    if (id) {
      condition.id = id;
    }
    if (groupId) {
      condition.groupId = groupId;
    }
    if (targetId) {
      condition.targetId = targetId;
    }
    if (targetType) {
      condition.targetType = targetType;
    }
    if (targetActorId) {
      condition.targetActorId = targetActorId;
    }
    if (isProcessed !== undefined) {
      condition.processedAt = isProcessed ? { [Op.ne]: null } : null;
    }

    const report = await this._libReportRepo.first({ where: condition });
    return this._reportMapper.toDomain(report);
  }

  public async findAll(input: FindAllReportsProps): Promise<ReportEntity[]> {
    const { groupIds, targetIds, status } = input;

    const condition: WhereOptions<ReportAttribute> = {};
    if (groupIds?.length) {
      condition.groupId = groupIds;
    }
    if (targetIds?.length) {
      condition.targetId = targetIds;
    }
    if (status) {
      condition.status = status;
    }

    const reports = await this._libReportRepo.findMany({ where: condition });
    return reports.map((report) => this._reportMapper.toDomain(report));
  }

  public async create(reportEntity: ReportEntity): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();

    try {
      const report = this._reportMapper.toPersistence(reportEntity);
      await this._libReportRepo.create(report, { transaction });

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

  public async update(reportEntity: ReportEntity): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();

    try {
      const report = this._reportMapper.toPersistence(reportEntity);
      const { id, status, reasonsCount, processedBy, processedAt } = report;

      await this._libReportRepo.update(
        { status, reasonsCount, processedBy, processedAt },
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

  public async getPagination(
    input: GetPaginationReportProps
  ): Promise<CursorPaginationResult<ReportEntity>> {
    const { limit, before, after, order = ORDER.DESC, column = 'createdAt' } = input;
    const { targetType, targetActorId, status, groupId } = input;

    const condition: WhereOptions<ReportAttribute> = {};
    if (targetType) {
      condition.targetType = targetType;
    }
    if (targetActorId) {
      condition.targetActorId = targetActorId;
    }
    if (status) {
      condition.status = status;
    }
    if (groupId) {
      condition.groupId = groupId;
    }

    const { rows, meta } = await this._libReportRepo.cursorPaginate(
      { where: condition },
      { limit, before, after, order, column }
    );
    return {
      rows: rows.map((report) => this._reportMapper.toDomain(report)),
      meta,
    };
  }
}
