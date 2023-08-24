import { ArticleDto } from '../../application/dto';
import { ArticleAttributes, ArticleEntity, ContentAttributes } from '../../domain/model/content';

import { categoryEntityMock } from './category.entity.mock';
import { imageEntityMock } from './image.entity.mock';

export const contentAttributesMock: ContentAttributes = {
  aggregation: { commentsCount: 0, totalUsersSeen: 0 },
  communityIds: [],
  createdAt: undefined,
  createdBy: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
  errorLog: undefined,
  groupIds: [],
  isHidden: false,
  isReported: false,
  isSaved: false,
  lang: undefined,
  markedReadImportant: false,
  media: { files: [], images: [], videos: [] },
  ownerReactions: [],
  privacy: undefined,
  publishedAt: undefined,
  quiz: undefined,
  quizResults: [],
  scheduledAt: undefined,
  setting: undefined,
  status: undefined,
  type: undefined,
  updatedAt: undefined,
  updatedBy: '',
  wordCount: 0,
  id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae7',
};

export const articleAttributesMock: ArticleAttributes = {
  ...contentAttributesMock,
  title: 'title',
  summary: 'summary',
  content: 'content',
  categories: [categoryEntityMock],
  cover: imageEntityMock,
  seriesIds: [],
  tags: [],
};

export const articleDtoMock: ArticleDto = {
  actor: undefined,
  audience: { groups: [] },
  categories: [],
  commentsCount: 0,
  communities: [],
  content: '',
  coverMedia: undefined,
  createdAt: undefined,
  id: '',
  isReported: false,
  isSaved: false,
  markedReadPost: false,
  mentions: undefined,
  ownerReactions: [],
  privacy: undefined,
  publishedAt: undefined,
  quiz: undefined,
  quizDoing: { quizParticipantId: '' },
  quizHighestScore: { quizParticipantId: '', score: 0 },
  reactionsCount: [],
  scheduledAt: undefined,
  series: [],
  setting: undefined,
  status: undefined,
  summary: '',
  tags: [],
  title: '',
  totalUsersSeen: 0,
  type: undefined,
  updatedAt: undefined,
  wordCount: 0,
};

export const articleEntityMock = new ArticleEntity(articleAttributesMock);
