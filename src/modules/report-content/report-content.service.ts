import { Op, QueryTypes } from 'sequelize';
import { UserDto } from '../auth';
import { BadRequestException, Injectable } from '@nestjs/common';
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
  StatisticsReportResponseDto,
  StatisticsReportResponsesDto,
  UpdateStatusReportDto,
} from './dto';
import {
  IReportContentAttribute,
  ReportContentModel,
} from '../../database/models/report-content.model';
import { GroupSharedDto } from '../../shared/group/dto';
import { UserService } from '../../shared/user';
import { getDatabaseConfig } from '../../config/database';

@Injectable()
export class ReportContentService {
  public constructor(
    private readonly _userService: UserService,
    private readonly _postService: PostService,
    private readonly _groupService: GroupService,
    private readonly _articleService: ArticleService,
    private readonly _commentService: CommentService,
    @InjectModel(ReportContentModel) private readonly _reportContentModel: typeof ReportContentModel
  ) {}

  public async getReports(getReportDto: GetReportDto): Promise<any> {
    const list = await this._reportContentModel.findAll({});
  }

  public async getStatistics(
    targetId: string,
    fetchReporter: number
  ): Promise<StatisticsReportResponsesDto> {
    if (fetchReporter > 10) {
      fetchReporter = 10;
    }
    const dbConfig = getDatabaseConfig();

    const reportCount = await this._reportContentModel.sequelize.query<{
      reasonType: string;
      total: string;
    }>(
      `SELECT reason_type as "reasonType",count(*) as total
           FROM ${dbConfig.schema}.report_contents WHERE target_id = :targetId
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
          ( SELECT * FROM  ${dbConfig.schema}.report_contents 
            WHERE reason_type = '${reportCount[i].reasonType}' AND target_id = '${targetId}'
            ORDER BY created_at DESC
            LIMIT ${fetchReporter} )
      `);
    }
    const queryStr = queries.join(' UNION ALL ');

    const reports = await this._reportContentModel.sequelize.query(queryStr, {
      mapToModel: true,
      model: ReportContentModel,
      type: QueryTypes.SELECT,
    });

    const reporterIds = reports.map((report) => report.createdBy);

    const userInfos = await this._userService.getMany(reporterIds);
    const reportByReasonTypeMap = new Map<string, StatisticsReportResponseDto>();

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
            reason: report.reason,
            reasonType: report.reasonType,
            total: parseInt(total ?? '0'),
          })
        );
      }
    }

    return new StatisticsReportResponsesDto([...reportByReasonTypeMap.values()], totalReport);
  }

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

    const insertData: IReportContentAttribute[] = groupInfos.map((group) => ({
      reason: reason,
      groupId: group.id,
      authorId: authorId,
      reportTo: reportTo,
      targetId: targetId,
      createdBy: createdBy,
      reasonType: reasonType,
      targetType: targetType,
      status: ReportStatus.CREATED,
      communityId: group.communityId,
    }));

    await this._reportContentModel.bulkCreate(insertData, {
      ignoreDuplicates: true,
    });

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
        break;
      }
    }
    return true;
  }

  public async getPostIdsReportedByUser(
    userId: string,
    options?: {
      reportTo?: ReportTo;
      targetType?: TargetType;
      groupIds?: string[];
    }
  ): Promise<string[]> {
    const { groupIds } = options ?? {};
    const condition = {
      [Op.and]: [
        {
          createdBy: userId,
        },
      ],
    };

    if (groupIds) {
      condition['']
    }
    const rows = await this._reportContentModel.findAll({
      where: {
        createdBy: userId,
      },
    });

    return rows.map((row) => row.id);
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
      throw new BadRequestException('Invalid group_ids');
    }
  }
}
