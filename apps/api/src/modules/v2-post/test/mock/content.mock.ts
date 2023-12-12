import { CONTENT_STATUS, CONTENT_TYPE, LANGUAGE, PRIVACY } from '@beincom/constants';
import { PostGroupAttributes, PostSeriesAttributes } from '@libs/database/postgres/model';
import { PostAttributes } from '@libs/database/postgres/model/post.model';
import { v4 } from 'uuid';

import { ArticleDto, PostDto } from '../../application/dto';
import { ArticleEntity, ContentEntity, PostEntity, SeriesEntity } from '../../domain/model/content';
import { ImageEntity } from '../../domain/model/media';

import { createMockCategoryEntity, createMockCategoryRecord } from './category.mock';
import { createMockGroupDto } from './group.mock';
import { createMockLinkPreviewEntity } from './link-preview.mock';
import { createMockFileEntity, createMockImageEntity, createMockVideoEntity } from './media.mock';
import { createMockQuizEntity, createMockQuizParticipantEntity } from './quiz.mock';
import { createMockTagEntity } from './tag.mock';
import { createMockUserDto } from './user.mock';

export function createMockContentEntity(data: Partial<PostAttributes> = {}): ContentEntity {
  const ownerId = v4();
  const now = new Date();

  return new ContentEntity({
    id: v4(),
    groupIds: data.groups ? data.groups.map((group) => group.groupId) : [v4()],
    title: data.title,
    content: data.content || '1111',
    createdBy: data.createdBy || ownerId,
    updatedBy: data.updatedBy || ownerId,
    aggregation: {
      commentsCount: data.commentsCount || 0,
      totalUsersSeen: data.totalUsersSeen || 0,
    },
    type: data.type || CONTENT_TYPE.POST,
    status: data.status || CONTENT_STATUS.PUBLISHED,
    media: data.mediaJson
      ? {
          files: data.mediaJson.files.map((file) => createMockFileEntity(file)),
          images: data.mediaJson.images.map((image) => createMockImageEntity(image)),
          videos: data.mediaJson.videos.map((video) => createMockVideoEntity(video)),
        }
      : { files: [], images: [], videos: [] },
    isHidden: data.isHidden || false,
    isReported: data.isReported || false,
    privacy: data.privacy || PRIVACY.OPEN,
    setting: {
      canComment: data.canComment !== undefined ? data.canComment : true,
      canReact: data.canReact !== undefined ? data.canReact : true,
      importantExpiredAt: data.importantExpiredAt || null,
      isImportant: data.isImportant || false,
    },
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  });
}

export function createMockPostRecord(data: Partial<PostAttributes> = {}): PostAttributes {
  const postId = v4();
  const ownerId = v4();
  const now = new Date();

  return {
    id: postId,
    isReported: true,
    isHidden: false,
    createdBy: ownerId,
    updatedBy: ownerId,
    privacy: PRIVACY.OPEN,
    status: CONTENT_STATUS.PUBLISHED,
    type: CONTENT_TYPE.POST,
    isImportant: false,
    importantExpiredAt: null,
    canComment: true,
    canReact: true,
    createdAt: now,
    updatedAt: now,
    markedReadPost: true,
    isSaved: true,
    isSeen: true,
    ownerReactions: [],
    errorLog: null,
    publishedAt: now,
    scheduledAt: null,
    lang: LANGUAGE.VN,
    groups: [createMockPostGroupRecord({ postId })],
    quiz: null,
    quizResults: null,
    wordCount: 4,
    commentsCount: 0,
    totalUsersSeen: 14,
    mediaJson: { files: [], images: [], videos: [] },
    title: undefined,
    summary: undefined,
    content: '1111',
    mentions: [],
    linkPreviewId: null,
    linkPreview: null,
    postSeries: null,
    tagsJson: [],
    videoIdProcessing: null,
    cover: null,
    coverJson: null,
    ...data,
  };
}

export function createMockPostEntity(data: Partial<PostAttributes> = {}): PostEntity {
  const post = createMockPostRecord(data);

  return new PostEntity({
    id: post.id,
    isReported: post.isReported,
    isHidden: post.isHidden,
    createdBy: post.createdBy,
    updatedBy: post.updatedBy,
    privacy: post.privacy,
    status: post.status,
    type: post.type,
    setting: {
      isImportant: post.isImportant,
      importantExpiredAt: post.importantExpiredAt,
      canComment: post.canComment,
      canReact: post.canReact,
    },
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    markedReadImportant: post.markedReadPost,
    isSaved: post.isSaved || false,
    isSeen: post.isSeen || false,
    ownerReactions: (post.ownerReactions || []).map((item) => ({
      id: item.id,
      reactionName: item.reactionName,
    })),
    errorLog: post.errorLog,
    publishedAt: post.publishedAt,
    scheduledAt: post.scheduledAt,
    lang: post.lang,
    groupIds: (post.groups || []).map((group) => group.groupId),
    postGroups: post.groups || [],
    quiz: post.quiz ? createMockQuizEntity(post.quiz) : undefined,
    quizResults: (post.quizResults || []).map(createMockQuizParticipantEntity),
    wordCount: post.wordCount,
    aggregation: {
      commentsCount: post.commentsCount,
      totalUsersSeen: post.totalUsersSeen,
    },
    media: {
      images: (post.mediaJson?.images || []).map(createMockImageEntity),
      files: (post.mediaJson?.files || []).map(createMockFileEntity),
      videos: (post.mediaJson?.videos || []).map(createMockVideoEntity),
    },
    title: post.title,
    content: post.content,
    mentionUserIds: post.mentions || [],
    linkPreview: post.linkPreview ? createMockLinkPreviewEntity(post.linkPreview) : undefined,
    seriesIds: (post.postSeries || []).map((series) => series.seriesId),
    tags: (post.tagsJson || []).map(createMockTagEntity),
    videoIdProcessing: post.videoIdProcessing,
  });
}

export function createMockPostDto(data: Partial<PostDto> = {}): PostDto {
  return new PostDto({
    id: v4(),
    audience: { groups: [createMockGroupDto()] },
    communities: [createMockGroupDto()],
    content: '1111',
    tags: [],
    series: [],
    quiz: null,
    quizHighestScore: null,
    quizDoing: null,
    setting: {
      canComment: true,
      canReact: true,
      importantExpiredAt: null,
      isImportant: false,
    },
    linkPreview: null,
    media: { files: [], images: [], videos: [] },
    actor: createMockUserDto(),
    status: CONTENT_STATUS.PUBLISHED,
    privacy: PRIVACY.OPEN,
    type: CONTENT_TYPE.POST,
    markedReadPost: true,
    isSaved: false,
    isSeen: false,
    isReported: false,
    mentions: {},
    commentsCount: 3,
    totalUsersSeen: 14,
    wordCount: 4,
    reactionsCount: [],
    ownerReactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    scheduledAt: null,
    publishedAt: new Date(),
    ...data,
  });
}

export function createMockArticleRecord(data: Partial<PostAttributes> = {}): PostAttributes {
  const articleId = v4();
  const coverId = v4();
  const ownerId = v4();
  const now = new Date();

  return {
    id: articleId,
    isReported: true,
    isHidden: false,
    createdBy: ownerId,
    updatedBy: ownerId,
    privacy: PRIVACY.OPEN,
    status: CONTENT_STATUS.PUBLISHED,
    type: CONTENT_TYPE.ARTICLE,
    isImportant: false,
    importantExpiredAt: null,
    canComment: true,
    canReact: true,
    createdAt: now,
    updatedAt: now,
    markedReadPost: true,
    isSaved: true,
    isSeen: true,
    ownerReactions: [],
    errorLog: null,
    publishedAt: now,
    scheduledAt: null,
    lang: LANGUAGE.VN,
    groups: [createMockPostGroupRecord({ postId: articleId })],
    quiz: null,
    quizResults: null,
    wordCount: 4,
    commentsCount: 0,
    totalUsersSeen: 14,
    mediaJson: { files: [], images: [], videos: [] },
    title: '1111',
    summary: '1111',
    content: '1111',
    mentions: [],
    linkPreviewId: null,
    linkPreview: null,
    postSeries: null,
    tagsJson: [],
    videoIdProcessing: null,
    cover: null,
    coverJson: {
      height: 298,
      id: coverId,
      mime_type: 'image/jpeg',
      url: `https://media.beincom.app/image/variants/post/content/${coverId}`,
      width: 166,
    },
    categories: [createMockCategoryRecord()],
    ...data,
  };
}

export function createMockArticleEntity(data: Partial<PostAttributes> = {}): ArticleEntity {
  const article = createMockArticleRecord(data);
  return new ArticleEntity({
    id: article.id,
    isReported: article.isReported,
    isHidden: article.isHidden,
    createdBy: article.createdBy,
    updatedBy: article.updatedBy,
    privacy: article.privacy,
    status: article.status,
    type: article.type,
    setting: {
      isImportant: article.isImportant,
      importantExpiredAt: article.importantExpiredAt,
      canComment: article.canComment,
      canReact: article.canReact,
    },
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    markedReadImportant: article.markedReadPost,
    isSaved: article.isSaved || false,
    isSeen: article.isSeen || false,
    ownerReactions: (article.ownerReactions || []).map((item) => ({
      id: item.id,
      reactionName: item.reactionName,
    })),
    errorLog: article.errorLog,
    publishedAt: article.publishedAt,
    scheduledAt: article.scheduledAt,
    lang: article.lang,
    groupIds: (article.groups || []).map((group) => group.groupId),
    postGroups: article.groups || [],
    quiz: article.quiz ? createMockQuizEntity(article.quiz) : undefined,
    quizResults: (article.quizResults || []).map(createMockQuizParticipantEntity),
    wordCount: article.wordCount,
    aggregation: {
      commentsCount: article.commentsCount,
      totalUsersSeen: article.totalUsersSeen,
    },
    title: article.title,
    summary: article.summary,
    content: article.content,
    categories: (article.categories || []).map(createMockCategoryEntity),
    cover: article.coverJson ? new ImageEntity(article.coverJson) : null,
    seriesIds: (article.postSeries || []).map((series) => series.seriesId),
    tags: (article.tagsJson || []).map(createMockTagEntity),
  });
}

export function createMockArticleDto(data: Partial<ArticleDto> = {}): ArticleDto {
  return new ArticleDto({
    id: v4(),
    audience: { groups: [createMockGroupDto()] },
    communities: [createMockGroupDto()],
    content: '1111',
    summary: '1111',
    title: '1111',
    categories: [],
    tags: [],
    series: [],
    setting: {
      canComment: true,
      canReact: true,
      importantExpiredAt: null,
      isImportant: false,
    },
    actor: createMockUserDto(),
    status: CONTENT_STATUS.PUBLISHED,
    privacy: PRIVACY.OPEN,
    type: CONTENT_TYPE.ARTICLE,
    markedReadPost: false,
    isSaved: false,
    isSeen: false,
    isReported: false,
    mentions: null,
    commentsCount: 0,
    totalUsersSeen: 0,
    wordCount: 0,
    coverMedia: null,
    reactionsCount: [],
    ownerReactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    scheduledAt: new Date(),
    publishedAt: new Date(),
    quiz: null,
    quizDoing: { quizParticipantId: '' },
    quizHighestScore: { quizParticipantId: '', score: 0 },
    ...data,
  });
}

export function createMockSeriesRecord(data: Partial<PostAttributes> = {}): PostAttributes {
  const seriesId = v4();
  const coverId = v4();
  const ownerId = v4();
  const now = new Date();

  return {
    id: seriesId,
    isReported: true,
    isHidden: false,
    createdBy: ownerId,
    updatedBy: ownerId,
    privacy: PRIVACY.OPEN,
    status: CONTENT_STATUS.PUBLISHED,
    type: CONTENT_TYPE.SERIES,
    isImportant: false,
    importantExpiredAt: null,
    canComment: true,
    canReact: true,
    createdAt: now,
    updatedAt: now,
    markedReadPost: true,
    isSaved: true,
    isSeen: true,
    ownerReactions: [],
    errorLog: null,
    publishedAt: now,
    scheduledAt: null,
    lang: LANGUAGE.VN,
    groups: [createMockPostGroupRecord({ postId: seriesId })],
    quiz: null,
    quizResults: null,
    wordCount: 0,
    commentsCount: 0,
    totalUsersSeen: 0,
    mediaJson: { files: [], images: [], videos: [] },
    title: '1111',
    summary: '1111',
    content: undefined,
    mentions: [],
    linkPreviewId: null,
    linkPreview: null,
    postSeries: null,
    tagsJson: [],
    videoIdProcessing: null,
    cover: null,
    coverJson: {
      height: 298,
      id: coverId,
      mime_type: 'image/jpeg',
      url: `https://media.beincom.app/image/variants/post/content/${coverId}`,
      width: 166,
    },
    itemIds: [],
    ...data,
  };
}

export function createMockSeriesEntity(data: Partial<PostAttributes> = {}): SeriesEntity {
  const series = createMockSeriesRecord(data);
  return new SeriesEntity({
    id: series.id,
    isReported: series.isReported,
    isHidden: series.isHidden,
    createdBy: series.createdBy,
    updatedBy: series.updatedBy,
    privacy: series.privacy,
    status: series.status,
    type: series.type,
    setting: {
      isImportant: series.isImportant,
      importantExpiredAt: series.importantExpiredAt,
      canComment: series.canComment,
      canReact: series.canReact,
    },
    createdAt: series.createdAt,
    updatedAt: series.updatedAt,
    markedReadImportant: series.markedReadPost,
    isSaved: series.isSaved || false,
    isSeen: series.isSeen || false,
    errorLog: series.errorLog,
    publishedAt: series.publishedAt,
    lang: series.lang,
    groupIds: (series.groups || []).map((group) => group.groupId),
    postGroups: series.groups || [],
    title: series.title,
    summary: series.summary,
    itemIds: series.itemIds || [],
    cover: series.coverJson ? new ImageEntity(series.coverJson) : null,
  });
}

export function createMockPostGroupRecord(
  data: Partial<PostGroupAttributes> = {}
): PostGroupAttributes {
  return {
    postId: v4(),
    groupId: v4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isArchived: false,
    isPinned: false,
    pinnedIndex: 0,
    ...data,
  };
}

export function createMockPostSeriesRecord(
  data: Partial<PostSeriesAttributes> = {}
): PostSeriesAttributes {
  return {
    postId: v4(),
    seriesId: v4(),
    zindex: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };
}
