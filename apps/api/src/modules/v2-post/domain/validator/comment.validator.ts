import { CONTENT_TARGET } from '@beincom/constants';
import { REPORT_STATUS } from '@libs/database/postgres/model';
import { Inject, Injectable } from '@nestjs/common';

import { ArrayHelper } from '../../../../common/helpers';
import { CommentNotFoundException } from '../exception';
import { CommentEntity } from '../model/comment';
import { IReportRepository, REPORT_REPOSITORY_TOKEN } from '../repositoty-interface';

import { ICommentValidator, UpdateCommentProps } from './interface';

@Injectable()
export class CommentValidator implements ICommentValidator {
  public constructor(
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository
  ) {}

  public getUpdateMasks(payload: UpdateCommentProps, comment: CommentEntity): string[] {
    const updateMasks = [];
    const { content, media, mentions, giphyId } = payload;

    if (content && content !== comment.get('content')) {
      updateMasks.push('content');
    }

    if (media && media?.images && Array.isArray(media?.images)) {
      const currentImageIds = (comment.get('media')?.images || []).map((image) => image.get('id'));
      if (!ArrayHelper.arraysEqual(currentImageIds, media.images)) {
        updateMasks.push('mediaJson');
      }
    }

    if (mentions && Array.isArray(mentions)) {
      const currentMentionIds = comment.get('mentions') || [];
      if (!ArrayHelper.arraysEqual(currentMentionIds, mentions)) {
        updateMasks.push('mentions');
      }
    }

    if (giphyId && giphyId !== comment.get('giphyId')) {
      updateMasks.push('giphyId');
    }

    return updateMasks;
  }

  public async validateNotHiddenComment(comment: CommentEntity): Promise<void> {
    const report = await this._reportRepo.findOne({
      where: {
        targetId: comment.get('id'),
        targetType: CONTENT_TARGET.COMMENT,
        status: REPORT_STATUS.HIDDEN,
      },
    });

    if (report) {
      throw new CommentNotFoundException();
    }
  }
}
