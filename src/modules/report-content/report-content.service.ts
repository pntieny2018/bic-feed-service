import { Op, QueryTypes } from 'sequelize';
import { UserDto } from '../auth';
import { CommentService } from '../comment';
import { InjectModel } from '@nestjs/sequelize';
import { GroupService } from '../../shared/group';
import { PostService } from '../post/post.service';
import { ReportStatus, ReportTo, TargetType } from './contstants';
import { ArticleService } from '../article/article.service';
import { ValidatorException } from '../../common/exceptions';
import {
  CreateReportDto,
  GetReportDto,
  GetReportType,
  ReportReviewResponsesDto,
  StatisticsReportResponseDto,
  StatisticsReportResponsesDto,
  UpdateStatusReportDto,
} from './dto';
import { Injectable } from '@nestjs/common';
import {
  IReportContentAttribute,
  ReportContentModel,
} from '../../database/models/report-content.model';
import { GroupSharedDto } from '../../shared/group/dto';
import { UserService } from '../../shared/user';
import { getDatabaseConfig } from '../../config/database';
import { plainToInstance } from 'class-transformer';
import {
  IReportContentDetailAttribute,
  ReportContentDetailModel,
} from '../../database/models/report-content-detail.model';
import { CreateReportEvent } from '../../events/report/create-report.event';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { ApproveReportEvent } from '../../events/report/approve-report.event';

@Injectable()
export class ReportContentService {
  public constructor(
    private readonly _userService: UserService,
    private readonly _postService: PostService,
    private readonly _groupService: GroupService,
    private readonly _articleService: ArticleService,
    private readonly _commentService: CommentService,
    private readonly _eventEmitter: InternalEventEmitterService,
    @InjectModel(ReportContentModel)
    private readonly _reportContentModel: typeof ReportContentModel,
    @InjectModel(ReportContentDetailModel)
    private readonly _reportContentDetailModel: typeof ReportContentDetailModel
  ) {}

  public async getReports(getReportDto: GetReportDto): Promise<ReportReviewResponsesDto[]> {
    const { targetType, limit, offset } = getReportDto;

    let conditionStr = `WHERE rc.report_type = :targetType`;

    if (targetType === GetReportType.ALL || !targetType) {
      conditionStr = '';
    }
    let results: Record<string, any>[] = await this._reportContentModel.sequelize.query(
      `
      SELECT 
        p.title as "article_title",
        p.content as "post_content",
        c.content as "comment_content",
        rc.*
      FROM bein_stream.report_contents rc 
      LEFT JOIN bein_stream.posts p on rc.target_id = p.id
      LEFT JOIN bein_stream.comments c on rc.target_id = c.id
      ${conditionStr}
      LIMIT :limit OFFSET :offset
    `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          limit: limit,
          offset: offset,
        },
      }
    );

    const authorIds = results.map((rs) => rs['author_id']);
    const reportIds = results.map((rs) => rs['id']);

    const reportStatistics = await this._reportContentDetailModel.sequelize.query<{
      reportId: string;
      total: string;
      reasonType: string;
    }>(
      ` SELECT  report_id as "reportId",
              count(*) as total,
              reason_type as "reasonType"
      FROM bein_stream.report_content_details
      GROUP BY report_id,reason_type
      HAVING report_id in (:reportIds)
    `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          reportIds: reportIds,
        },
      }
    );

    const reportStatisticsMap = new Map<
      string,
      { total: number; reasonType: string; description: string; reason?: string }[]
    >();

    const reasonTypes = await this._groupService.getReasonType();

    for (const reportStatistic of reportStatistics) {
      const { reportId, reasonType, total } = reportStatistic;
      if (reportStatisticsMap.has(reportId)) {
        reportStatisticsMap.get(reportId).push({
          total: parseInt(total ?? '0'),
          reasonType: reasonType,
          description: reasonTypes.find((r) => r.id === reasonType).description ?? '',
        });
      } else {
        reportStatisticsMap.set(reportId, [
          {
            total: parseInt(total ?? '0'),
            reasonType: reasonType,
            description: reasonTypes.find((r) => r.id === reasonType).description ?? '',
          },
        ]);
      }
    }
    const authors = await this._userService.getMany(authorIds);

    results = results.map((rs) => {
      const author = authors.find((a) => a.id === rs['author_id']);
      const details = reportStatisticsMap.get(rs['id']);
      delete author.groups;
      // const reason ?
      return { ...rs, author: new UserDto(author), details: details };
    });
    return plainToInstance(ReportReviewResponsesDto, results, {
      excludeExtraneousValues: true,
    });
  }

  public async getStatistics(
    targetId: string,
    fetchReporter: number
  ): Promise<StatisticsReportResponsesDto> {
    if (fetchReporter > 10) {
      fetchReporter = 10;
    }
    const dbConfig = getDatabaseConfig();

    const reportCount = await this._reportContentDetailModel.sequelize.query<{
      reasonType: string;
      total: string;
    }>(
      `SELECT reason_type as "reasonType",count(*) as total
           FROM ${dbConfig.schema}.report_content_details WHERE target_id = :targetId
           GROUP BY reason_type;`,
      {
        replacements: {
          targetId: targetId,
        },
        type: QueryTypes.SELECT,
      }
    );

    const totalReportType = reportCount.length;

    const queries: string[] = [];
    let totalReport = 0;

    for (let i = 0; i < totalReportType; i++) {
      totalReport += parseInt(reportCount[i].total ?? '0');
      queries.push(`
          ( SELECT * FROM  ${dbConfig.schema}.report_content_details
            WHERE reason_type = '${reportCount[i].reasonType}' AND target_id = '${targetId}'
            ORDER BY created_at DESC
            LIMIT ${fetchReporter} )
      `);
    }
    const queryStr = queries.join(' UNION ALL ');

    const reports = await this._reportContentDetailModel.sequelize.query(queryStr, {
      mapToModel: true,
      model: ReportContentDetailModel,
      type: QueryTypes.SELECT,
    });

    const reporterIds = reports.map((report) => report.createdBy);

    const userInfos = await this._userService.getMany(reporterIds);
    const reportByReasonTypeMap = new Map<string, StatisticsReportResponseDto>();
    const reasonTypes = await this._groupService.getReasonType();

    for (const report of reports) {
      const userInfo = userInfos.find((u) => u.id === report.createdBy) ?? null;
      // clean group;
      delete userInfo.groups;
      if (reportByReasonTypeMap.has(report.reasonType)) {
        reportByReasonTypeMap.get(report.reasonType).reporters.push(userInfo);
      } else {
        const total = reportCount.find((rc) => rc.reasonType === report.reasonType).total;

        reportByReasonTypeMap.set(
          report.reasonType,
          new StatisticsReportResponseDto({
            reporters: [userInfo],
            reason: report.reason
              ? report.reason
              : reasonTypes.find((r) => r.id === report.reasonType).description ?? '',
            reasonType: report.reasonType,
            total: parseInt(total ?? '0'),
          })
        );
      }
    }

    return new StatisticsReportResponsesDto([...reportByReasonTypeMap.values()], totalReport);
  }

  /**
   * TODO: will optimize
   * @param user
   * @param createReportDto
   */
  public async report(user: UserDto, createReportDto: CreateReportDto): Promise<boolean> {
    const createdBy = user.id;

    const { groupIds, reportTo, targetType, targetId, reason, reasonType } = createReportDto;

    const reasonTypes = await this._groupService.getReasonType();

    const isValidReasonType = reasonTypes.some((r) => r.id === reasonType);

    if (!isValidReasonType) {
      throw new ValidatorException('Unknown reason type');
    }

    let authorId = '';
    let post,
      comment = null;
    let audienceIds = [];
    let groupInfos: GroupSharedDto[] = [];
    let isExisted = false;
    switch (targetType) {
      case TargetType.POST:
      case TargetType.ARTICLE:
        [isExisted, post] = await this._postService.isExisted(targetId, true);
        authorId = post?.createdBy;
        audienceIds = post?.groups.map((g) => g.groupId) ?? [];
        await this._validateGroupIds(audienceIds, groupIds, reportTo);
        break;
      case TargetType.COMMENT:
      case TargetType.CHILD_COMMENT:
        [isExisted, comment] = await this._commentService.isExisted(targetId, true);
        authorId = comment?.createdBy;
        [isExisted, post] = await this._postService.isExisted(comment.postId, true);
        audienceIds = post.groups.map((g) => g.groupId);
        await this._validateGroupIds(audienceIds, groupIds, reportTo);
        break;
      default:
        throw new ValidatorException('Unknown resource');
    }

    if (!authorId && !isExisted) {
      throw new ValidatorException('Unknown resource');
    }

    audienceIds = post.groups.map((g) => g.groupId);

    groupInfos = await this._groupService.getMany(audienceIds);

    const existedReport = await this._reportContentModel.findOne({
      where: {
        targetId: targetId,
      },
    });

    if (existedReport) {
      const details: IReportContentDetailAttribute[] = groupInfos.map((group) => ({
        reportId: existedReport.id,
        groupId: group.id,
        reportTo: reportTo,
        targetId: targetId,
        targetType: targetType,
        createdBy: createdBy,
        reasonType: reasonType,
        reason: reason,
      }));

      await this._reportContentDetailModel.bulkCreate(details, {
        ignoreDuplicates: true,
      });

      const report = existedReport.toJSON();
      report.details = details;
      this._eventEmitter.emit(new CreateReportEvent({ actor: user, ...report }));

      return true;
    }

    const reportData: IReportContentAttribute = {
      targetId: targetId,
      targetType: targetType,
      details: [],
      authorId: authorId,
      status: ReportStatus.CREATED,
    };

    reportData.details = groupInfos.map((group) => ({
      groupId: group.id,
      reportTo: reportTo,
      targetId: targetId,
      targetType: targetType,
      createdBy: createdBy,
      reasonType: reasonType,
      reason: reason,
    }));

    const transaction = await this._reportContentModel.sequelize.transaction();
    // insert to two table need transaction
    try {
      const report = await this._reportContentModel.create(reportData, {
        returning: true,
        include: [
          {
            model: ReportContentDetailModel,
            as: 'details',
          },
        ],
      });
      await transaction.commit();
      this._eventEmitter.emit(new CreateReportEvent({ actor: user, ...report.toJSON() }));
    } catch (ex) {
      await transaction.rollback();
      throw ex;
    }

    return true;
  }

  public async update(admin: UserDto, updateStatusReport: UpdateStatusReportDto): Promise<boolean> {
    const { status } = updateStatusReport;

    // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
    const [_, records] = await this._reportContentModel.update(
      {
        status: status,
      },
      {
        where: {
          [Op.or]: {
            targetId: updateStatusReport.targetIds,
            reportId: updateStatusReport.reportIds,
          },
          status: {
            [Op.not]: ReportStatus.HID,
          },
        },
        returning: true,
      }
    );

    for (const reportContentModel of records) {
      if (
        reportContentModel.targetType !== TargetType.COMMENT &&
        reportContentModel.targetType !== TargetType.CHILD_COMMENT
      ) {
        this._eventEmitter.emit(
          new ApproveReportEvent({
            actor: admin,
            ...reportContentModel.toJSON(),
          })
        );
      }
    }
    return true;
  }

  private async _validateGroupIds(
    audienceIds: string[],
    groupIdsNeedValidate: string[],
    type: ReportTo
  ): Promise<void> {
    const groups = await this._groupService.getMany(audienceIds);
    const existGroups = groups.filter((group) => {
      const isCommunity = type === ReportTo.COMMUNITY;
      return groupIdsNeedValidate.includes(group.id) && group.isCommunity == isCommunity;
    });
    if (existGroups.length < groupIdsNeedValidate.length) {
      throw new ValidatorException('Invalid group_ids');
    }
  }
}
