import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { ReportHiddenEvent } from '../../../domain/event';
import { CommentNotFoundException, ContentNotFoundException } from '../../../domain/exception';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
} from '../../../domain/repositoty-interface';

@EventsHandlerAndLog(ReportHiddenEvent)
export class ReportHiddenEventHandler implements IEventHandler<ReportHiddenEvent> {
  public constructor(
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepo: ICommentRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository
  ) {}

  public async handle(event: ReportHiddenEvent): Promise<void> {
    const { report } = event.payload;

    const targetType = report.get('targetType');
    const targetId = report.get('targetId');

    switch (targetType) {
      case CONTENT_TARGET.COMMENT: {
        await this._hideComment(targetId);
        break;
      }

      case CONTENT_TARGET.POST:
      case CONTENT_TARGET.ARTICLE: {
        await this._hideContent(targetId);
        break;
      }

      default:
        break;
    }
  }

  private async _hideComment(commentId: string): Promise<void> {
    const commentEntity = await this._commentRepo.findOne({ id: commentId });
    if (!commentEntity) {
      throw new CommentNotFoundException();
    }

    commentEntity.hide();
    await this._commentRepo.update(commentEntity);
  }

  private async _hideContent(contentId: string): Promise<void> {
    const contentEntity = await this._contentRepo.findContentById(contentId);
    if (!contentEntity) {
      throw new ContentNotFoundException();
    }

    contentEntity.hide();
    await this._contentRepo.update(contentEntity);
  }
}
