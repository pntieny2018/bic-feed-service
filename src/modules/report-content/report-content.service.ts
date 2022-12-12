import { Op } from 'sequelize';
import { UserDto } from '../auth';
import { Injectable } from '@nestjs/common';
import { CommentService } from '../comment';
import { InjectModel } from '@nestjs/sequelize';
import { GroupService } from '../../shared/group';
import { PostService } from '../post/post.service';
import { ReportStatus, TargetType } from './contstants';
import { ArticleService } from '../article/article.service';
import { LogicException, ValidatorException } from '../../common/exceptions';
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
import { HTTP_STATUS_ID } from '../../common/constants';

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

  public async countInfo() {
    const response = await this._reportContentModel;
  }
  public async getStatistics(targetId: string): Promise<StatisticsReportResponsesDto> {
    const { rows: reportModels, count: total } = await this._reportContentModel.findAndCountAll({
      where: {
        targetId: targetId,
      },
    });

    const reportResponses = new StatisticsReportResponsesDto([], total);

    const reporterIdByTypeMap = new Map<
      string,
      Omit<StatisticsReportResponseDto, 'reporters'> & { reporters: string[] }
    >();
    for (const reportModel of reportModels) {
      const report = reportModel.toJSON();

      if (reporterIdByTypeMap.has(report.reasonType)) {
        const statisticsReport = reporterIdByTypeMap.get(report.reasonType);
        statisticsReport.reporters.push(report.createdBy);
        statisticsReport.total += 1;
        reporterIdByTypeMap.set(report.reasonType, statisticsReport);
      } else {
        reporterIdByTypeMap.set(report.reasonType, {
          reason: report.reason,
          reasonType: report.reasonType,
          targetType: report.targetType,
          total: 0,
          reporters: [],
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
    for (const [_, statisticsReport] of reporterIdByTypeMap) {
      const { reporters, ...data } = statisticsReport;
      const reporterInfos = await this._userService.getMany(reporters);

      reportResponses.reports.push(
        new StatisticsReportResponseDto({
          ...data,
          reporters: reporterInfos,
        })
      );
    }

    return reportResponses;
  }

  public async report(user: UserDto, createReportDto: CreateReportDto): Promise<boolean> {
    const createdBy = user.id;
    const { targetType, targetId, reason, reasonType, reportTo } = createReportDto;

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
        break;
      case TargetType.COMMENT:
      case TargetType.CHILD_COMMENT:
        [isExisted, comment] = await this._commentService.isExisted(targetId, true);
        authorId = comment?.createdBy;
        [isExisted, post] = await this._postService.isExisted(comment.postId, true);
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
}
