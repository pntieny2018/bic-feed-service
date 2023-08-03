import { Injectable } from '@nestjs/common';
import { ICommentValidator } from './interface';
import { CommentEntity } from '../model/comment';
import { UpdateCommentCommandPayload } from '../../application/command/update-comment/update-comment.command';
import { ArrayHelper } from '../../../../common/helpers';

@Injectable()
export class CommentValidator implements ICommentValidator {
  public getUpdateMasks(payload: UpdateCommentCommandPayload, comment: CommentEntity): string[] {
    const updateMasks = [];
    const { content, media, mentions, giphyId } = payload;

    if (content && content !== comment.get('content')) updateMasks.push('content');

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

    if (giphyId && giphyId !== comment.get('giphyId')) updateMasks.push('giphyId');

    return updateMasks;
  }
}
