import { v4 } from 'uuid';
import { postRecordMock } from './post.model.mock';
import { PostEntity } from '../../domain/model/content';

export const postEntityMock = new PostEntity({
  id: v4(),
  groupIds: postRecordMock.groups.map((group) => group.groupId),
  content: postRecordMock.content,
  createdBy: postRecordMock.createdBy,
  updatedBy: postRecordMock.updatedBy,
  aggregation: {
    commentsCount: postRecordMock.commentsCount,
    totalUsersSeen: postRecordMock.totalUsersSeen,
  },
  type: postRecordMock.type,
  status: postRecordMock.status,
  media: postRecordMock.mediaJson,
  isHidden: postRecordMock.isHidden,
  isReported: postRecordMock.isReported,
  privacy: postRecordMock.privacy,
  setting: {
    canComment: postRecordMock.canComment,
    canReact: postRecordMock.canReact,
    importantExpiredAt: postRecordMock.importantExpiredAt,
    isImportant: postRecordMock.isImportant,
  },
  createdAt: postRecordMock.createdAt,
  updatedAt: postRecordMock.updatedAt,
  mentionUserIds: [],
  linkPreview: null,
  seriesIds: [],
  tags: [],
});
