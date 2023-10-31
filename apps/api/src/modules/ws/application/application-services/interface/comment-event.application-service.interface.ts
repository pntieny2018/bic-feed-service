import { CONTENT_TYPE } from '@beincom/constants';

import { CommentBaseDto } from '../../../../v2-post/application/dto';

export const COMMENT_EVENT_APPLICATION_SERVICE = 'COMMENT_EVENT_APPLICATION_SERVICE';

export type CommentCreatedEventPayload = {
  event: string;
  recipients: string[];
  contentId: string;
  contentType: CONTENT_TYPE;
  comment: CommentBaseDto;
  commentId: string;
  parentId: string;
};

export interface ICommentEventApplicationService {
  emitCommentCreatedEvent(payload: CommentCreatedEventPayload): Promise<void>;
}
