import { PostType } from '../../../../../database/models/post.model';

export const mockedArticleCreated = {
  id: 'ad70928e-cffd-44a9-9b27-19faa7210530',
  isDraft: true,
  type: PostType.ARTICLE,
  content: 'bbbbbb',
  hashtags: ['hashtag1'],
  title: 'aaa',
  summary: 'bbbb',
  createdBy: '438e292f-d8a3-4777-8cd2-0b8a61fd049c',
  updatedBy: '438e292f-d8a3-4777-8cd2-0b8a61fd049c',
  isImportant: false,
  importantExpiredAt: null,
  canShare: true,
  canComment: true,
  canReact: true,
  isProcessing: false,
  updatedAt: '2022-05-19T07:31:55.504Z',
  createdAt: '2022-05-19T07:31:55.504Z',
  commentsCount: 0,
  giphyId: null,
};
