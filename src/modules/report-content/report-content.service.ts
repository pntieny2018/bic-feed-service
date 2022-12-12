import { Op } from 'sequelize';
import { UserDto } from '../auth';
import { Injectable } from '@nestjs/common';
import { CommentService } from '../comment';
import { InjectModel } from '@nestjs/sequelize';
import { GroupService } from '../../shared/group';
import { PostService } from '../post/post.service';
import { ReportStatus, TargetType } from './contstants';
import { ArticleService } from '../article/article.service';
import { ValidatorException } from '../../common/exceptions';
import { CreateReportDto, UpdateStatusReportDto } from './dto';
import {
  IReportContentGenealogy,
  ReportContentModel,
} from '../../database/models/report-content.model';
import { NIL } from 'uuid';

@Injectable()
export class ReportContentService {
  public constructor(
    private readonly _groupService: GroupService,
    private readonly _postService: PostService,
    private readonly _articleService: ArticleService,
    private readonly _commentService: CommentService,
    @InjectModel(ReportContentModel) private readonly _reportContentModel: typeof ReportContentModel
  ) {}

  public async getListReport(): Promise<any> {}

  public async report(user: UserDto, createReportDto: CreateReportDto): Promise<boolean> {
    const createdBy = user.id;
    const { targetType, targetId, reason, reasonType } = createReportDto;

    let authorId = '';
    const genealogies: IReportContentGenealogy[] = [];
    let post,
      comment = null;
    let audienceIds = [];
    let groupInfos = [];
    let isExisted = false;
    switch (targetType) {
      case TargetType.POST:
      case TargetType.ARTICLE:
        //eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
        [isExisted, post] = await this._postService.isExisted(targetId, true);
        authorId = post?.createdBy;
        audienceIds = post?.groups.map((g) => g.groupId) ?? [];
        groupInfos = await this._groupService.getMany(audienceIds);

        for (const groupInfo of groupInfos) {
          const { communityId } = groupInfo;
          genealogies.push({
            communityId: communityId,
            postId: post.id,
          });
        }

        break;
      case TargetType.COMMENT:
      case TargetType.CHILD_COMMENT:
        // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
        [isExisted, comment] = await this._commentService.isExisted(targetId, true);
        authorId = comment?.createdBy;
        [isExisted, post] = await this._postService.isExisted(comment.postId, true);
        audienceIds = post.groups.map((g) => g.groupId);
        groupInfos = await this._groupService.getMany(audienceIds);
        for (const groupInfo of groupInfos) {
          const { communityId } = groupInfo;
          genealogies.push({
            communityId: communityId,
            commentId: comment.id,
            postId: post.id,
            parentCommentId: comment.parentId,
          });
        }
        break;
      default:
        throw new ValidatorException('Unknown resource');
    }

    if (!authorId && !isExisted) {
      throw new ValidatorException('Unknown resource');
    }

    await this._reportContentModel.create(
      {
        createdBy: createdBy,
        targetId: targetId,
        targetType: targetType,
        status: ReportStatus.CREATED,
        in: genealogies,
        authorId: authorId,
        reason: reason,
        reasonType: reasonType,
      },
      {
        ignoreDuplicates: true,
      }
    );

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
}
