import {
  CONTENT_CACHE_REPOSITORY_TOKEN,
  IContentCacheRepository,
} from '@api/modules/v2-post/domain/repositoty-interface/content-cache.repository.interface';
import { ORDER } from '@beincom/constants';
import { CursorPaginationResult } from '@libs/database/postgres/common';
import { ReportAttribute } from '@libs/database/postgres/model';
import { LibReportDetailRepository, LibReportRepository } from '@libs/database/postgres/repository';
import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { uniq, isBoolean } from 'lodash';
import { Sequelize, WhereOptions } from 'sequelize';

import { ReportEntity } from '../../domain/model/report';
import {
  GetPaginationReportProps,
  IReportRepository,
  FindOneReportProps,
  FindAllReportsProps,
  GetReportedTargetIdsByReporterIdProps,
} from '../../domain/repositoty-interface';
import { ReportMapper } from '../mapper';

@Injectable()
export class ReportRepository implements IReportRepository {
  public constructor(
    private readonly _libReportRepo: LibReportRepository,
    private readonly _libReportDetailRepo: LibReportDetailRepository,
    private readonly _reportMapper: ReportMapper,

    @InjectConnection()
    private readonly _sequelizeConnection: Sequelize,
    @Inject(CONTENT_CACHE_REPOSITORY_TOKEN)
    private readonly _contentCacheRepository: IContentCacheRepository
  ) {}

  public async findOne(input: FindOneReportProps): Promise<ReportEntity> {
    const { id, groupId, targetId, targetType, targetActorId, status } = input;

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
    if (status) {
      condition.status = status;
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
    const { limit, before, after, order = ORDER.DESC, sortColumns = ['createdAt'] } = input;
    const { targetTypes, targetActorId, status, groupId, isDistinctTarget } = input;

    const condition: WhereOptions<ReportAttribute> = {};
    if (targetTypes?.length) {
      condition.targetType = targetTypes;
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
      {
        where: condition,
        ...(isBoolean(isDistinctTarget) && {
          selectRaw: [
            ['DISTINCT(target_id)', 'targetId'],
            ['MAX(created_at)', 'createdAt'],
          ],
          group: ['target_id'],
        }),
      },
      { limit, before, after, order, sortColumns }
    );

    return {
      rows: rows.map((report) => this._reportMapper.toDomain(report)),
      meta,
    };
  }

  public async getReportedTargetIdsByReporterId(
    input: GetReportedTargetIdsByReporterIdProps
  ): Promise<string[]> {
    const { reporterId, groupIds, targetTypes } = input;

    if (!reporterId) {
      return [];
    }

    const reportDetails = await this._libReportDetailRepo.findMany({
      where: { reporterId },
      select: ['id'],
    });

    if (!reportDetails?.length) {
      return [];
    }

    const reportIds = reportDetails.map((reportDetail) => reportDetail.id);
    const condition: WhereOptions<ReportAttribute> = { id: reportIds };
    if (groupIds?.length) {
      condition.groupId = groupIds;
    }
    if (targetTypes?.length) {
      condition.targetType = targetTypes;
    }

    const reports = await this._libReportRepo.findMany({ where: condition, select: ['targetId'] });

    return uniq(reports.map((report) => report.targetId));
  }

  public async getReporterIdsByTargetId(targetId: string): Promise<string[]> {
    if (!targetId) {
      return [];
    }

    const reportDetails = await this._libReportDetailRepo.findMany({
      where: { targetId },
      select: ['reporterId'],
    });

    return uniq(reportDetails.map((reportDetail) => reportDetail.reporterId));
  }

  public async checkIsReported(reporterId: string, targetId: string): Promise<boolean> {
    const reportedIds = await this.getTargetIdsByReporterId(reporterId);
    return reportedIds.includes(targetId);
  }

  public async getTargetIdsByReporterId(reporterId: string): Promise<string[]> {
    if (!reporterId) {
      return [];
    }

    const targetIdCached = await this._contentCacheRepository.getReportedTargetIdsByUserId(
      reporterId
    );
    if (targetIdCached?.length) {
      return targetIdCached;
    }

    const reportDetails = await this._libReportDetailRepo.findMany({
      where: { reporterId },
      select: ['targetId'],
    });

    const targetIds = uniq(reportDetails.map((reportDetail) => reportDetail.targetId));
    if (!targetIds?.length) {
      return [];
    }

    await this._contentCacheRepository.cacheUserReportedContent(reporterId, targetIds);

    return targetIds;
  }
}
