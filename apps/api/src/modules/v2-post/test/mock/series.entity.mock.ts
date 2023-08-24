import { CONTENT_STATUS, CONTENT_TYPE, PRIVACY } from '@beincom/constants';
import { v4 } from 'uuid';

import { SeriesEntity } from '../../domain/model/content';
import { ImageEntity } from '../../domain/model/media';

import { postRecordMock } from './post.model.mock';

export const seriesEntityMock = new SeriesEntity({
  id: v4(),
  groupIds: postRecordMock.groups.map((group) => group.groupId),
  title: postRecordMock.title,
  summary: postRecordMock.summary,
  cover: new ImageEntity(postRecordMock.coverJson),
  itemIds: [],
  createdBy: postRecordMock.createdBy,
  updatedBy: postRecordMock.updatedBy,
  aggregation: {
    commentsCount: postRecordMock.commentsCount,
    totalUsersSeen: postRecordMock.totalUsersSeen,
  },
  type: postRecordMock.type as unknown as CONTENT_TYPE,
  status: postRecordMock.status as unknown as CONTENT_STATUS,
  media: postRecordMock.mediaJson,
  isHidden: postRecordMock.isHidden,
  isReported: postRecordMock.isReported,
  privacy: postRecordMock.privacy as unknown as PRIVACY,
  setting: {
    canComment: postRecordMock.canComment,
    canReact: postRecordMock.canReact,
    importantExpiredAt: postRecordMock.importantExpiredAt,
    isImportant: postRecordMock.isImportant,
  },
  createdAt: postRecordMock.createdAt,
  updatedAt: postRecordMock.updatedAt,
});
