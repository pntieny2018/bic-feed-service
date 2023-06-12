import { v4 } from 'uuid';
import { postRecordMock } from './post.model.mock';
import { SeriesEntity } from '../../domain/model/content/series.entity';
import { ImageEntity } from '../../domain/model/media';

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
});
