import { ORDER } from '@beincom/constants';
import { RedisService } from '@libs/infra/redis';
import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { plainToInstance } from 'class-transformer';
import { uniq } from 'lodash';
import { Op, QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { CACHE_KEYS } from '../../common/constants/casl.constant';
import { PageDto } from '../../common/dto';
import { ValidatorException } from '../../common/exceptions';
import { StringHelper } from '../../common/helpers';
import { getDatabaseConfig } from '../../config/database';
import { IPost, PostType } from '../../database/models/post.model';
import {
  IReportContentDetailAttribute,
  ReportContentDetailModel,
} from '../../database/models/report-content-detail.model';
import {
  IReportContentAttribute,
  ReportContentModel,
} from '../../database/models/report-content.model';
import { ApproveReportEvent } from '../../events/report/approve-report.event';
import { CreateReportEvent } from '../../events/report/create-report.event';
import { ArticleService } from '../article/article.service';
import { CommentService } from '../comment';
import { CommentResponseDto } from '../comment/dto/response';
import { FeedService } from '../feed/feed.service';
import { PostResponseDto } from '../post/dto/responses';
import { PostService } from '../post/post.service';
import { ReactionService } from '../reaction';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../v2-group/application';
import { IUserApplicationService, USER_APPLICATION_TOKEN, UserDto } from '../v2-user/application';

import { ReportStatus, TargetType } from './contstants';
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
import { DetailContentReportResponseDto } from './dto/detail-content-report.response.dto';

@Injectable()
export class ReportContentService {
  public constructor(
    @InjectConnection()
    private readonly _sequelize: Sequelize,
    private readonly _feedService: FeedService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userAppService: IUserApplicationService,
    private readonly _postService: PostService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    private readonly _articleService: ArticleService,
    private readonly _commentService: CommentService,
    private readonly _eventEmitter: InternalEventEmitterService,
    @InjectModel(ReportContentModel)
    private readonly _reportContentModel: typeof ReportContentModel,
    @InjectModel(ReportContentDetailModel)
    private readonly _reportContentDetailModel: typeof ReportContentDetailModel,
    private _store: RedisService
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

    const authors = await this._userAppService.findAllByIds(authorIds);

    results = results.map((rs) => {
      const author = authors.find((a) => a.id === rs['author_id']);
      const details = reportStatisticsMap.get(`${rs['id']}`);
      return { ...rs, author: author, details: details };
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

    const reasonTypes = await this.getReasonType();

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
  ): Promise<PageDto<PostResponseDto | CommentResponseDto>> {
    const { limit, offset, order, specTargetIds, targetType } = getOptions;

    if (specTargetIds?.length && targetType === TargetType.COMMENT) {
      return this.getCommentDetail(author, getOptions);
    }

    let query = `
       SELECT rc.id as "id" , rc.target_id as "targetId" FROM ${
         getDatabaseConfig().schema
       }.report_contents rc
       INNER JOIN  ${getDatabaseConfig().schema}.posts p ON p.id = rc.target_id
       WHERE p.deleted_at IS NULL
       AND rc.status = 'HID' 
       AND rc.target_type in ('POST','ARTICLE') 
       AND rc.author_id = :authorId
    `;

    let countQuery = `
       SELECT count(*) as total FROM ${getDatabaseConfig().schema}.report_contents rc
       INNER JOIN  ${getDatabaseConfig().schema}.posts p ON p.id = rc.target_id
       WHERE p.deleted_at IS NULL
       AND rc.status = 'HID' 
       AND rc.target_type in ('POST','ARTICLE') 
       AND rc.author_id = :authorId
    `;

    const orderAndPaginateQuery = `    
       ORDER BY rc.created_at ${order === ORDER.DESC ? 'DESC' : 'ASC'}
       LIMIT :limit OFFSET :offset
    `;

    if (specTargetIds && specTargetIds.length > 0) {
      query =
        query +
        ` AND p.id IN   ( ${specTargetIds.map((id) => this._sequelize.escape(id)).join(',')} ) `;
      countQuery =
        countQuery +
        ` AND p.id IN   ( ${specTargetIds.map((id) => this._sequelize.escape(id)).join(',')} ) `;
    }

    const rows = await this._sequelize.query<{ id: string; targetId: string }>(
      query + orderAndPaginateQuery,
      {
        type: QueryTypes.SELECT,
        replacements: {
          authorId: author.id,
          limit: limit,
          offset: offset,
        },
      }
    );

    const count = await this._sequelize.query<{ total: string }>(countQuery, {
      type: QueryTypes.SELECT,
      replacements: {
        authorId: author.id,
        ids: specTargetIds,
      },
    });

    const total = count[0]?.total ?? '0';

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
      meta(offset + limit + 1 <= parseInt(total))
    );

    responses.list = responses.list
      .map((post) => {
        const reportId = postReportMap.get(post.id);
        if (!reportId) {
          return null;
        }
        const reportDetails = reportStatisticsMap.get(reportId);
        return { ...post, reportDetails };
      })
      .filter((item) => item);

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

    const userInfos = await this._userAppService.findAllByIds(reporterIds);
    const reportByReasonTypeMap = new Map<string, StatisticsReportResponseDto>();
    const reasonTypes = await this.getReasonType();

    for (const report of reports) {
      const userInfo = userInfos.find((u) => u.id === report.createdBy) ?? null;
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
  private async _getValidGroupIds(
    audienceIds: string[],
    groupIdsNeedValidate: string[]
  ): Promise<GroupDto[]> {
    //TODO: implement for Group later
    const groups = await this._groupAppService.findAllByIds(audienceIds);
    const postRootGroupIds = groups.map((group) => group.rootGroupId);
    const isExistGroups = groupIdsNeedValidate.every((rootGroupId) => {
      return postRootGroupIds.includes(rootGroupId);
    });
    if (!isExistGroups) {
      throw new ValidatorException('Invalid group_ids');
    }
    return groups;
  }

  /**
   * TODO: will optimize
   * @param user
   * @param createReportDto
   */
  public async report(user: UserDto, createReportDto: CreateReportDto): Promise<boolean> {
    const { authorId, groupIds } = await this.transformDataRequest(user, createReportDto);
    //TODO: will optimize later
    createReportDto.groupIds = groupIds;

    const existedReport = await this._reportContentModel.findOne({
      where: {
        targetId: createReportDto.targetId,
      },
    });

    if (existedReport) {
      await this.addNewReportDetails(user, {
        ...createReportDto,
        groupIds: groupIds,
        existedReport: existedReport.toJSON(),
      });

      return true;
    }
    await this.createNewReport(user, {
      ...createReportDto,
      authorId: authorId,
      groupIds: groupIds,
    });

    return true;
  }

  public async transformDataRequest(
    user: UserDto,
    createReportDto: CreateReportDto
  ): Promise<{
    authorId: string;
    groupIds: string[];
  }> {
    const createdBy = user.id;

    const { groupIds, targetType, targetId, reasonType } = createReportDto;

    const reasonTypes = await this.getReasonType();

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

    const groups = await this._getValidGroupIds(audienceIds, groupIds);

    const validGroupIds = [...new Set(groups.map((g) => g.rootGroupId))];

    if (authorId === createdBy) {
      throw new ValidatorException('You cant not report yourself');
    }
    return {
      authorId: authorId,
      groupIds: validGroupIds,
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
      if (existedReport.status === ReportStatus.IGNORED) {
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

      let content = '';
      let post: IPost = null;
      switch (existedReport.targetType) {
        case TargetType.COMMENT:
          const comment = await this._commentService.findComment(existedReport.targetId);
          post = await this._postService.findPost({
            postId: comment.postId,
          });
          content = comment.content;
          break;

        case TargetType.ARTICLE:
        case TargetType.POST:
          post = await this._postService.findPost({
            postId: existedReport.targetId,
          });

          content =
            post.type === PostType.POST
              ? StringHelper.removeMarkdownCharacter(post.content).slice(0, 200)
              : StringHelper.removeMarkdownCharacter(post.title).slice(0, 200);
          break;

        default:
          break;
      }

      const postGroupIds = post?.groups.map((g) => g.groupId) ?? [];
      existedReport.details = postGroupIds.map((groupId) => {
        return {
          groupId,
          reportId: existedReport.id,
          reportTo: reportTo,
          targetId: targetId,
          targetType: targetType,
          createdBy: user.id,
          reasonType: reasonType,
          reason: reason,
        };
      });

      const detailJson = await this._reportContentDetailModel.findAll({
        where: {
          reportId: existedReport.id,
        },
      });
      const actorReportedIds = uniq(detailJson.map((dt) => dt.toJSON()).map((dt) => dt.createdBy));
      const actorReported = await this._userAppService.findAllByIds(actorReportedIds);

      this._eventEmitter.emit(
        new CreateReportEvent({
          actor: user,
          groupIds: groupIds,
          ...existedReport,
          content,
          actorReported,
        })
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

      await this._reportContentDetailModel.bulkCreate(details, {
        ignoreDuplicates: true,
        returning: true,
      });

      await trx.commit();

      const detailJson = await this._reportContentDetailModel.findAll({
        where: {
          reportId: report.id,
        },
      });

      const actorReportedIds = uniq(detailJson.map((dt) => dt.toJSON()).map((dt) => dt.createdBy));
      const actorReported = await this._userAppService.findAllByIds(actorReportedIds);

      const reportJson = report.toJSON();

      let content = '';
      let post: IPost = null;
      switch (reportJson.targetType) {
        case TargetType.COMMENT:
          const comment = await this._commentService.findComment(reportJson.targetId);
          post = await this._postService.findPost({
            postId: reportJson.targetId,
          });

          content = comment.content;
          break;

        case TargetType.ARTICLE:
        case TargetType.POST:
          post = await this._postService.findPost({
            postId: reportJson.targetId,
          });

          content =
            post.type === PostType.POST
              ? StringHelper.removeMarkdownCharacter(post.content).slice(0, 200)
              : StringHelper.removeMarkdownCharacter(post.title).slice(0, 200);
          break;

        default:
          break;
      }

      const postGroupIds = post?.groups.map((g) => g.groupId) ?? [];
      reportJson.details = postGroupIds.map((groupId) => {
        return {
          groupId,
          reportId: report.id,
          reportTo: reportTo,
          targetId: targetId,
          targetType: targetType,
          createdBy: user.id,
          reasonType: reasonType,
          reason: reason,
        };
      });

      this._eventEmitter.emit(
        new CreateReportEvent({
          actor: user,
          groupIds: groupIds,
          ...reportJson,
          content,
          actorReported,
        })
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

    if (!reportDetails || !reportDetails?.length) {
      throw new ValidatorException('Report not found or resolved');
    }

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
        where: {
          [Op.or]: {
            targetId: updateStatusReport.targetIds ?? [],
            id: updateStatusReport.reportIds ?? [],
          },
          status: ReportStatus.HID,
        },
      });

      for (const report of reports) {
        const reportJson = report.toJSON();

        const detailJson = await this._reportContentDetailModel.findAll({
          where: {
            reportId: report.id,
          },
        });

        const actorReportedIds = uniq(
          detailJson.map((dt) => dt.toJSON()).map((dt) => dt.createdBy)
        );
        const actorReported = await this._userAppService.findAllByIds(actorReportedIds);

        let content = '';
        let post: IPost = null;
        switch (reportJson.targetType) {
          case TargetType.COMMENT:
            const comment = await this._commentService.findComment(reportJson.targetId);
            post = await this._postService.findPost({
              postId: reportJson.targetId,
            });

            content = comment.content;
            break;

          case TargetType.ARTICLE:
          case TargetType.POST:
            post = await this._postService.findPost({
              postId: reportJson.targetId,
            });

            content =
              post.type === PostType.POST
                ? StringHelper.removeMarkdownCharacter(post.content).slice(0, 200)
                : StringHelper.removeMarkdownCharacter(post.title).slice(0, 200);
            break;

          default:
            break;
        }

        const postGroupIds = post?.groups.map((g) => g.groupId) ?? [];
        reportJson.details = postGroupIds.map((groupId) => {
          return {
            groupId,
            reportTo: reportDetails[0].reportTo,
            targetId: reportJson.targetId,
            targetType: reportJson.targetType,
          };
        });

        this._eventEmitter.emit(
          new ApproveReportEvent({
            actor: admin,
            ...reportJson,
            groupIds: groupIds,
            actorReported,
            content,
          })
        );
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

    const actor = await this._userAppService.findOne(reportStatus.authorId);
    if (reportStatus.targetType === TargetType.COMMENT) {
      const comment = await this._commentService.getComment(actor, targetId, 0);
      comment.reactionsCount = ReactionService.transformReactionFormat(comment.reactionsCount);
      detailContentReportResponseDto.setComment(comment);

      return detailContentReportResponseDto;
    }

    if (reportStatus.targetType === TargetType.POST) {
      const post = await this._postService.get(targetId, null, { withComment: false }, false);
      post.reactionsCount = ReactionService.transformReactionFormat(post.reactionsCount);
      detailContentReportResponseDto.setPost(post);
      return detailContentReportResponseDto;
    }

    if (reportStatus.targetType === TargetType.ARTICLE) {
      const article = await this._articleService.get(targetId, null, { withComment: false }, false);
      article.reactionsCount = ReactionService.transformReactionFormat(article.reactionsCount);
      detailContentReportResponseDto.setArticle(article);
      return detailContentReportResponseDto;
    }
    throw new ValidatorException(`Unknown Target Type: ${reportStatus.targetType}`);
  }

  public async canPerform(userId: string, rootGroupIds: string[]): Promise<void> {
    //TODO: need Group provide API to check admin
    // const adminInfo = await this._groupHttpService.getAdminIds(rootGroupIds);
    //
    // const adminIds = Object.values(adminInfo.admins).flat();
    // const ownerIds = Object.values(adminInfo.owners).flat();
    //
    // const canView = adminIds.includes(userId) || ownerIds.includes(userId);
    //
    // if (!canView) {
    //   throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    // }
  }

  public async getCommentDetail(
    author: UserDto,
    getOptions: GetBlockedContentOfMeDto
  ): Promise<PageDto<CommentResponseDto>> {
    const { limit, offset, order, specTargetIds } = getOptions;

    const query = `
       SELECT rc.id as "id" , rc.target_id as "targetId" FROM ${
         getDatabaseConfig().schema
       }.report_contents rc
       INNER JOIN  ${getDatabaseConfig().schema}.comments c ON c.id = rc.target_id
       WHERE c.deleted_at IS NULL
        AND c.id in  ( ${specTargetIds.map((id) => this._sequelize.escape(id)).join(',')} )
        AND rc.status = 'HID' 
        AND rc.target_type in ('COMMENT','CHILD_COMMENT') 
        AND rc.author_id = :authorId
        ORDER BY rc.created_at ${order === ORDER.DESC ? 'DESC' : 'ASC'}
        LIMIT :limit OFFSET :offset
    `;

    const rows = await this._sequelize.query<{ id: string; targetId: string }>(query, {
      type: QueryTypes.SELECT,
      replacements: {
        authorId: author.id,
        limit: limit,
        offset: offset,
      },
    });

    if (!rows || !rows.length) {
      return new PageDto([], {
        limit: limit,
        offset: offset,
        total: 0,
        hasNextPage: false,
      });
    }
    const reportIds = [];
    const targetIds = [];

    const commentReportMap = new Map<string, string>();

    for (const item of rows) {
      targetIds.push(item.targetId);
      reportIds.push(item.id);
      commentReportMap.set(item.targetId, item.id);
    }

    if (!targetIds || !targetIds.length) {
      return new PageDto([], {
        limit: limit,
        offset: offset,
        total: 0,
        hasNextPage: false,
      });
    }
    const reportStatisticsMap = await this.getDetailsReport(reportIds);

    const responses = await this._commentService.getComment(author, targetIds[0], 0);

    const reportDetails = reportStatisticsMap.get(reportIds[0]);

    return new PageDto([{ ...responses, reportDetails }], {
      limit: limit,
      offset: offset,
      total: 1,
      hasNextPage: false,
    });
  }

  public async getReasonType(): Promise<{ id: string; description: string }[]> {
    const raws: unknown[] = await this._store.get(CACHE_KEYS.REPORT_REASON_TYPE);
    if (!raws || !raws?.length) {
      //FIX ME : it was blocked by group service
      return [
        {
          id: 'spam',
          description: 'Spam',
        },
        {
          id: 'bullying_threatening_or_harassing',
          description: 'Bullying, threatening or harassing',
        },
        {
          id: 'violent_or_porn',
          description: 'Violent, pornographic, or sexually explicit',
        },
        {
          id: 'pretending_someone',
          description: 'Pretending to be someone else',
        },
        {
          id: 'illegal',
          description: 'Illegal',
        },
        {
          id: 'others',
          description: 'Others',
        },
      ];
    }
    return raws.map((raw) => ({
      id: raw['id'],
      description: raw['value'],
    }));
  }
}
