import { UserDto } from '../auth';
import { Op, QueryTypes } from 'sequelize';
import { CommentService } from '../comment';
import { InjectModel } from '@nestjs/sequelize';
import { PostService } from '../post/post.service';
import { ReportStatus, TargetType } from './contstants';
import { GroupHttpService, GroupService } from '../../shared/group';
import { LogicException, ValidatorException } from '../../common/exceptions';
import {
  CreateReportDto,
  GetBlockedContentOfMeDto,
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
import { FeedService } from '../feed/feed.service';
import { PageDto } from '../../common/dto';
import { PostResponseDto } from '../post/dto/responses';
import { DetailContentReportResponseDto } from './dto/detail-content-report.response.dto';
import { HTTP_STATUS_ID } from '../../common/constants';
import { ArticleService } from '../article/article.service';
import { UserDataShareDto } from '../../shared/user/dto';

@Injectable()
export class ReportContentService {
  public constructor(
    private readonly _feedService: FeedService,
    private readonly _userService: UserService,
    private readonly _postService: PostService,
    private readonly _groupService: GroupService,
    private readonly _articleService: ArticleService,
    private readonly _commentService: CommentService,
    private readonly _groupHttpService: GroupHttpService,
    private readonly _eventEmitter: InternalEventEmitterService,
    @InjectModel(ReportContentModel)
    private readonly _reportContentModel: typeof ReportContentModel,
    @InjectModel(ReportContentDetailModel)
    private readonly _reportContentDetailModel: typeof ReportContentDetailModel
  ) {}

  /**
   * TODO: will optimize
   * @param admin
   * @param getReportDto
   */
  public async getReports(
    admin: UserDto,
    getReportDto: GetReportDto
  ): Promise<ReportReviewResponsesDto[]> {
    const dbConfig = getDatabaseConfig();

    const { targetType, groupId, limit, offset, order } = getReportDto;

    await this.canPerform(admin.id, [groupId]);

    let conditionStr = `AND rc.target_type = $targetType`;

    if (targetType === GetReportType.ALL || !targetType) {
      conditionStr = '';
    }
    let results: Record<string, any>[] = await this._reportContentModel.sequelize.query(
      `
      SELECT 
        p.title as "article_title",
        p.content as "post_content",
        c.content as "comment_content",
        c.parent_id as "comment_parent_id",
        c.post_id as "comment_post_id",
        rc.*
      FROM  ${dbConfig.schema}.report_contents rc 
      LEFT JOIN ${dbConfig.schema}.posts p on rc.target_id = p.id
      LEFT JOIN ${dbConfig.schema}.comments c on rc.target_id = c.id
      WHERE rc.id IN (SELECT 
                 rcd.report_id FROM ${dbConfig.schema}.report_content_details rcd
                 WHERE rcd.group_id = $groupId )
      AND rc.status = $status
      ${conditionStr}
      ORDER BY rc.created_at ${order}
      LIMIT $limit OFFSET $offset
    `,
      {
        type: QueryTypes.SELECT,
        bind: {
          targetType: targetType,
          limit: limit,
          offset: offset,
          groupId: groupId,
          status: ReportStatus.CREATED,
        },
      }
    );

    if (!results.length) {
      return [];
    }

    const reportIds = results.map((rs) => rs['id']);

    const reportStatisticsMap = await this.getDetailsReport(reportIds, groupId);

    const authorIds = results.map((rs) => rs['author_id']);

    const authors = await this._userService.getMany(authorIds);

    results = results.map((rs) => {
      const author = authors.find((a) => a.id === rs['author_id']);
      const details = reportStatisticsMap.get(`${rs['id']}`);
      delete author.groups;
      // const reason ?
      return { ...rs, author: new UserDataShareDto(author), details: details };
    });

    return plainToInstance(ReportReviewResponsesDto, results, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * TODO: will optimize
   * @param reportIds
   * @param groupId
   */
  public async getDetailsReport(
    reportIds: string[],
    groupId?: string
  ): Promise<
    Map<string, { total: number; reasonType: string; description: string; reason?: string }[]>
  > {
    const reportStatistics = await this._reportContentDetailModel.sequelize.query<{
      reportId: string;
      total: string;
      reasonType: string;
    }>(
      ` SELECT  report_id as "reportId",
              count(*) as total,
              reason_type as "reasonType"
      FROM bein_stream.report_content_details WHERE  report_id in (:reportIds) ${
        groupId ? 'AND group_id = :groupId' : ''
      }
      GROUP BY report_id,reason_type
    `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          reportIds: reportIds,
          groupId: groupId,
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
    return reportStatisticsMap;
  }

  /**
   * TODO: will optimize
   * @param author
   * @param getOptions
   */
  public async getContentBlockedOfMe(
    author: UserDto,
    getOptions: GetBlockedContentOfMeDto
  ): Promise<PageDto<PostResponseDto>> {
    const { limit, offset, order, specTargetIds } = getOptions;

    const conditions = {};

    if (specTargetIds && specTargetIds.length > 0) {
      conditions['targetId'] = specTargetIds;
    }

    const { rows, count } = await this._reportContentModel.findAndCountAll({
      attributes: ['id', 'targetId'],
      where: {
        authorId: author.id,
        targetType: {
          [Op.in]: [TargetType.POST, TargetType.ARTICLE],
        },
        ...conditions,
        status: ReportStatus.HID,
      },
      limit: limit,
      offset: offset,
      order: [['createdAt', order]],
    });

    const meta = (hasNextPage: boolean) => ({
      limit: limit,
      offset: offset,
      hasNextPage: hasNextPage,
    });

    if (!rows || !rows.length) {
      return new PageDto<PostResponseDto>([], meta(false));
    }

    const reportIds = [];
    const targetIds = [];

    const postReportMap = new Map<string, string>();

    for (const item of rows) {
      targetIds.push(item.targetId);
      reportIds.push(item.id);
      postReportMap.set(item.targetId, item.id);
    }

    if (!targetIds || !targetIds.length) {
      return new PageDto<PostResponseDto>([], meta(false));
    }

    const reportStatisticsMap = await this.getDetailsReport(reportIds);

    const responses = await this._feedService.getContentBlockedOfMe(
      author,
      targetIds,
      meta(offset + limit + 1 <= count)
    );

    responses.list = responses.list.map((post) => {
      const reportId = postReportMap.get(post.id);
      const reportDetails = reportStatisticsMap.get(reportId);
      return { ...post, reportDetails };
    });

    return responses;
  }

  /**
   * TODO: will optimize
   * @param admin
   * @param reportId
   * @param targetId
   * @param groupId
   * @param fetchReporter
   */
  public async getStatistics(
    admin: UserDto,
    reportId: string,
    targetId: string,
    groupId: string,
    fetchReporter: number
  ): Promise<StatisticsReportResponsesDto> {
    await this.canPerform(admin.id, [groupId]);

    if (fetchReporter > 10) {
      fetchReporter = 10;
    }

    const dbConfig = getDatabaseConfig();

    const reportStatus = await this._reportContentModel.findOne({
      where: {
        id: reportId,
        status: ReportStatus.CREATED,
      },
    });

    if (!reportStatus) {
      throw new ValidatorException('Report not found or resolved');
    }

    const reportCount = await this._reportContentDetailModel.sequelize.query<{
      reasonType: string;
      total: string;
    }>(
      `SELECT reason_type as "reasonType",
                  count(*) as total,
                  group_id as "groupId"
           FROM ${dbConfig.schema}.report_content_details
           WHERE target_id = :targetId AND report_id = :reportId AND group_id =:groupId
           GROUP BY reason_type, group_id`,
      {
        replacements: {
          reportId: reportId,
          targetId: targetId,
          groupId: groupId,
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
            WHERE reason_type = '${reportCount[i].reasonType}' AND target_id = :targetId AND report_id = :reportId AND group_id =:groupId
            ORDER BY created_at DESC
            LIMIT ${fetchReporter} )
      `);
    }
    const queryStr = queries.join(' UNION ALL ');

    const reports = await this._reportContentDetailModel.sequelize.query(queryStr, {
      mapToModel: true,
      model: ReportContentDetailModel,
      type: QueryTypes.SELECT,
      replacements: {
        reportId: reportId,
        targetId: targetId,
        groupId: groupId,
      },
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
            description: reasonTypes.find((rt) => rt.id === report.reasonType)?.description ?? '',
            reason: report.reason,
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
   * @param audienceIds
   * @param groupIdsNeedValidate
   * @private
   */
  private async _validateGroupIds(
    audienceIds: string[],
    groupIdsNeedValidate: string[]
  ): Promise<void> {
    //TODO: implement for Group later
    const groups = await this._groupService.getMany(audienceIds);
    const postRootGroupIds = groups.map((group) => group.rootGroupId);
    const isExistGroups = groupIdsNeedValidate.every((rootGroupId) => {
      return postRootGroupIds.includes(rootGroupId);
    });
    if (!isExistGroups) {
      throw new ValidatorException('Invalid group_ids');
    }
  }

  /**
   * TODO: will optimize
   * @param user
   * @param createReportDto
   */
  public async report(user: UserDto, createReportDto: CreateReportDto): Promise<boolean> {
    const { authorId, audienceIds } = await this.transformDataRequest(user, createReportDto);

    const existedReport = await this._reportContentModel.findOne({
      where: {
        targetId: createReportDto.targetId,
      },
    });

    if (existedReport) {
      await this.addNewReportDetails(user, {
        ...createReportDto,
        groupIds: audienceIds,
        existedReport: existedReport.toJSON(),
      });

      return true;
    }
    await this.createNewReport(user, {
      ...createReportDto,
      authorId: authorId,
      groupIds: audienceIds,
    });

    return true;
  }

  public async transformDataRequest(
    user: UserDto,
    createReportDto: CreateReportDto
  ): Promise<{
    authorId: string;
    audienceIds: string[];
  }> {
    const createdBy = user.id;

    const { groupIds, targetType, targetId, reasonType } = createReportDto;

    const reasonTypes = await this._groupService.getReasonType();

    const isValidReasonType = reasonTypes.some((r) => r.id === reasonType);

    if (!isValidReasonType) {
      throw new ValidatorException('Unknown reason type');
    }

    let authorId = '';
    let post = null;
    let comment = null;
    let audienceIds = [];
    let isExisted = false;

    if ([TargetType.POST, TargetType.ARTICLE].includes(targetType)) {
      [isExisted, post] = await this._postService.isExisted(targetId, true);
      if (isExisted) {
        authorId = post.createdBy;
      }
    } else if (targetType === TargetType.COMMENT) {
      [isExisted, comment] = await this._commentService.isExisted(targetId, true);
      if (isExisted) {
        authorId = comment.createdBy;
        [isExisted, post] = await this._postService.isExisted(comment.postId, true);
      }
    } else {
      throw new ValidatorException('Unknown resource');
    }

    if (!authorId || !isExisted || !post) {
      throw new ValidatorException('Unknown resource');
    }

    audienceIds = post.groups.map((g) => g.groupId) ?? [];

    await this._validateGroupIds(audienceIds, groupIds);

    if (authorId === createdBy) {
      throw new ValidatorException('You cant not report yourself');
    }
    return {
      authorId: authorId,
      audienceIds: audienceIds,
    };
  }

  public async addNewReportDetails(
    user: UserDto,
    createReportDto: CreateReportDto & {
      groupIds: string[];
      existedReport: IReportContentAttribute;
    }
  ): Promise<void> {
    const { targetId, targetType, reportTo, groupIds, reason, reasonType, existedReport } =
      createReportDto;

    const details: IReportContentDetailAttribute[] = groupIds.map((groupId) => ({
      reportId: existedReport.id,
      groupId: groupId,
      reportTo: reportTo,
      targetId: targetId,
      targetType: targetType,
      createdBy: user.id,
      reasonType: reasonType,
      reason: reason,
    }));

    const trx = await this._reportContentModel.sequelize.transaction();

    try {
      if (existedReport.status === ReportStatus.HID) {
        await this._reportContentModel.update(
          {
            status: ReportStatus.CREATED,
          },
          {
            where: {
              id: existedReport.id,
            },
          }
        );
      }

      await this._reportContentDetailModel.bulkCreate(details, {
        ignoreDuplicates: true,
      });

      await trx.commit();

      existedReport.details = details;

      this._eventEmitter.emit(
        new CreateReportEvent({ actor: user, groupIds: groupIds, ...existedReport })
      );
    } catch (ex) {
      await trx.rollback();
      throw ex;
    }
  }

  public async createNewReport(
    user: UserDto,
    createReportDto: CreateReportDto & { authorId: string; groupIds: string[] }
  ): Promise<void> {
    const { targetId, targetType, authorId, reportTo, groupIds, reason, reasonType } =
      createReportDto;

    const reportData: IReportContentAttribute = {
      targetId: targetId,
      targetType: targetType,
      authorId: authorId,
      status: ReportStatus.CREATED,
    };

    // insert to two table need transaction
    const trx = await this._reportContentModel.sequelize.transaction();

    try {
      const report = await this._reportContentModel.create(reportData, {
        returning: true,
      });

      const details: IReportContentDetailAttribute[] = groupIds.map((groupId) => ({
        reportId: report.id,
        groupId: groupId,
        reportTo: reportTo,
        targetId: targetId,
        targetType: targetType,
        createdBy: user.id,
        reasonType: reasonType,
        reason: reason,
      }));

      const detailModels = await this._reportContentDetailModel.bulkCreate(details, {
        ignoreDuplicates: true,
        returning: true,
      });

      await trx.commit();

      const detailJson = detailModels.map((detail) => detail.toJSON());

      const reportJson = report.toJSON();

      reportJson.details = detailJson;

      this._eventEmitter.emit(
        new CreateReportEvent({ actor: user, groupIds: groupIds, ...reportJson })
      );
    } catch (ex) {
      await trx.rollback();
      throw ex;
    }
  }

  /**
   * TODO: will optimize
   * @param admin
   * @param updateStatusReport
   */
  public async updateStatusReport(
    admin: UserDto,
    updateStatusReport: UpdateStatusReportDto
  ): Promise<boolean> {
    const { status } = updateStatusReport;

    const reportDetails = await this._reportContentDetailModel.findAll({
      where: {
        [Op.or]: {
          targetId: updateStatusReport.targetIds ?? [],
          reportId: updateStatusReport.reportIds ?? [],
        },
      },
    });

    const reportDetailJsons = reportDetails.map((dt) => dt.toJSON());

    const groupIds = [...new Set(reportDetailJsons.map((g) => g.groupId))];

    await this.canPerform(admin.id, groupIds);

    const [affectedCount] = await this._reportContentModel.update(
      {
        status: status,
        updatedBy: admin.id,
      },
      {
        where: {
          [Op.or]: {
            targetId: updateStatusReport.targetIds ?? [],
            id: updateStatusReport.reportIds ?? [],
          },
          status: {
            [Op.not]: ReportStatus.HID,
          },
        },
      }
    );

    if (affectedCount > 0) {
      const reports = await this._reportContentModel.findAll({
        include: [
          {
            model: ReportContentDetailModel,
            as: 'details',
            order: [['createdAt', 'DESC']],
            limit: 1,
          },
        ],
        where: {
          [Op.or]: {
            targetId: updateStatusReport.targetIds ?? [],
            id: updateStatusReport.reportIds ?? [],
          },
          status: ReportStatus.HID,
        },
      });

      for (const report of reports) {
        if ([TargetType.ARTICLE, TargetType.POST].includes(report.targetType)) {
          this._eventEmitter.emit(
            new ApproveReportEvent({
              actor: admin,
              ...report.toJSON(),
              groupIds: groupIds,
            })
          );
        }
      }
    }

    return true;
  }

  /**
   * TODO: will optimize
   * @param admin
   * @param rootGroupId
   * @param targetId
   */
  public async getContent(
    admin: UserDto,
    rootGroupId: string,
    targetId: string
  ): Promise<DetailContentReportResponseDto> {
    await this.canPerform(admin.id, [rootGroupId]);

    const reportStatus = await this._reportContentModel.findOne({
      where: {
        targetId: targetId,
        status: ReportStatus.CREATED,
      },
    });
    if (!reportStatus) {
      throw new ValidatorException('Report not found or resolved');
    }

    const detailContentReportResponseDto = new DetailContentReportResponseDto();

    if (reportStatus.targetType === TargetType.COMMENT) {
      const comment = await this._commentService.getComment(
        {
          id: reportStatus.authorId,
        },
        targetId,
        0
      );
      detailContentReportResponseDto.setComment(comment);

      return detailContentReportResponseDto;
    }
    if (reportStatus.targetType === TargetType.POST) {
      const post = await this._postService.get(targetId, null, { withComment: false }, false);
      detailContentReportResponseDto.setPost(post);
      return detailContentReportResponseDto;
    }

    if (reportStatus.targetType === TargetType.ARTICLE) {
      const article = await this._articleService.get(targetId, null, { withComment: false }, false);
      detailContentReportResponseDto.setArticle(article);
      return detailContentReportResponseDto;
    }
    throw new ValidatorException(`Unknown Target Type: ${reportStatus.targetType}`);
  }

  public async canPerform(userId: string, rootGroupIds: string[]): Promise<void> {
    const adminInfo = await this._groupHttpService.getAdminIds(rootGroupIds);

    const adminIds = Object.values(adminInfo.admins).flat();
    const ownerIds = Object.values(adminInfo.owners).flat();

    const canView = adminIds.includes(userId) || ownerIds.includes(userId);

    if (!canView) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }
}
