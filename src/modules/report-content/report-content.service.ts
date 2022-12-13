import { Op } from 'sequelize';
import { UserDto } from '../auth';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CommentService } from '../comment';
import { InjectModel } from '@nestjs/sequelize';
import { GroupService } from '../../shared/group';
import { PostService } from '../post/post.service';
import { ReportContentModel } from '../../database/models/report-content.model';
import { ReportStatus, ReportTo, TargetType } from './contstants';
import { ArticleService } from '../article/article.service';
import { ValidatorException } from '../../common/exceptions';
import { CreateReportDto, UpdateStatusReportDto } from './dto';

@Injectable()
export class ReportContentService {
  public constructor(
    private readonly _groupService: GroupService,
    private readonly _postService: PostService,
    private readonly _articleService: ArticleService,
    private readonly _commentService: CommentService,
    @InjectModel(ReportContentModel) private readonly _reportContentModel: typeof ReportContentModel
  ) {}

  public async getListReport(): Promise<any> {
    const list = await this._reportContentModel.findAll({});
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
  public async report(user: UserDto, createReportDto: CreateReportDto): Promise<boolean> {
    const createdBy = user.id;
    const { groupIds, reportTo, targetType, targetId, reason, reasonType } = createReportDto;
    let authorId = '';
    let post,
      comment = null;
    let audienceIds = [];
    let isExisted = false;
    switch (targetType) {
      case TargetType.POST:
      case TargetType.ARTICLE:
        //eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
        [isExisted, post] = await this._postService.isExisted(targetId, true);
        authorId = post?.createdBy;
        audienceIds = post?.groups.map((g) => g.groupId) ?? [];
        await this._validateGroupIds(audienceIds, groupIds, reportTo);
        break;
      case TargetType.COMMENT:
      case TargetType.CHILD_COMMENT:
        // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
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

    const insertRows = groupIds.map((groupId) => ({
      createdBy,
      updatedBy: createdBy,
      targetId,
      targetType,
      groupId: groupId,
      status: ReportStatus.CREATED,
      authorId,
      reason,
      reasonType,
      reportTo,
    }));
    await this._reportContentModel.bulkCreate(insertRows, {
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
            [Op.not]: ReportStatus.HIDED,
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
}
