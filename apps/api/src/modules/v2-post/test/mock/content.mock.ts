import { CONTENT_STATUS, CONTENT_TYPE, PRIVACY } from '@beincom/constants';
import { PostAttributes } from '@libs/database/postgres/model/post.model';
import { v4 } from 'uuid';

import { ArticleDto, PostDto } from '../../application/dto';
import { ArticleEntity, ContentEntity, PostEntity, SeriesEntity } from '../../domain/model/content';

import { createMockCategoryEntity, createMockCategoryRecord } from './category.mock';
import { createMockGroupDto } from './group.mock';
import { createMockLinkPreviewEntity } from './link-preview.mock';
import { createMockFileEntity, createMockImageEntity, createMockVideoEntity } from './media.mock';
import { createMockTagEntity, createMockTagRecord } from './tag.mock';
import { createMockUserDto } from './user.mock';

export function createMockContentEntity(data: Partial<PostAttributes> = {}): ContentEntity {
  const ownerId = v4();
  const now = new Date();

  return new ContentEntity({
    id: v4(),
    groupIds: data.groups ? data.groups.map((group) => group.groupId) : [v4()],
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
    commentsCount: 3,
    totalUsersSeen: 14,
    wordCount: 4,
    isImportant: false,
    importantExpiredAt: null,
    canComment: true,
    canReact: true,
    isHidden: false,
    isReported: false,
    content: '1111',
    title: null,
    mentions: [],
    type: CONTENT_TYPE.POST,
    summary: null,
    privacy: PRIVACY.OPEN,
    tagsJson: [],
    createdBy: ownerId,
    updatedBy: ownerId,
    linkPreviewId: null,
    status: CONTENT_STATUS.PUBLISHED,
    publishedAt: now,
    groups: [{ groupId: v4(), postId }],
    createdAt: now,
    updatedAt: now,
    tags: [createMockTagRecord()],
    series: [createMockSeriesRecord()],
    mediaJson: { files: [], images: [], videos: [] },
    ...data,
  };
}

export function createMockPostEntity(data: Partial<PostAttributes> = {}): PostEntity {
  const post = createMockPostRecord(data);
  return new PostEntity({
    id: post.id,
    groupIds: post.groups.map((group) => group.groupId),
    content: post.content,
    createdBy: post.createdBy,
    updatedBy: post.updatedBy,
    aggregation: {
      commentsCount: post.commentsCount,
      totalUsersSeen: post.totalUsersSeen,
    },
    type: post.type,
    status: post.status,
    media: {
      files: post.mediaJson.files.map((file) => createMockFileEntity(file)),
      images: post.mediaJson.images.map((image) => createMockImageEntity(image)),
      videos: post.mediaJson.videos.map((video) => createMockVideoEntity(video)),
    },
    isHidden: post.isHidden,
    isReported: post.isReported,
    privacy: post.privacy,
    setting: {
      canComment: post.canComment,
      canReact: post.canReact,
      importantExpiredAt: post.importantExpiredAt,
      isImportant: post.isImportant,
    },
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    linkPreview: post.linkPreview ? createMockLinkPreviewEntity(post.linkPreview) : null,
    seriesIds: post.series.map((series) => series.id),
    tags: post.tags.map((tag) => createMockTagEntity(tag)),
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
    commentsCount: 3,
    totalUsersSeen: 14,
    wordCount: 4,
    isImportant: false,
    importantExpiredAt: null,
    canComment: true,
    canReact: true,
    isHidden: false,
    isReported: false,
    content: '1111',
    title: '1111',
    mentions: [],
    type: CONTENT_TYPE.ARTICLE,
    summary: '1111',
    privacy: PRIVACY.OPEN,
    tagsJson: [],
    createdBy: ownerId,
    updatedBy: ownerId,
    linkPreviewId: null,
    status: CONTENT_STATUS.PUBLISHED,
    publishedAt: now,
    groups: [{ groupId: v4(), postId: articleId }],
    createdAt: now,
    updatedAt: now,
    tags: [createMockTagRecord()],
    series: [createMockSeriesRecord()],
    categories: [createMockCategoryRecord()],
    coverJson: {
      height: 298,
      id: coverId,
      mime_type: 'image/jpeg',
      url: `https://media.beincom.app/image/variants/post/content/${coverId}`,
      width: 166,
    },
    ...data,
  };
}

export function createMockArticleEntity(data: Partial<PostAttributes> = {}): ArticleEntity {
  const article = createMockArticleRecord(data);
  return new ArticleEntity({
    id: article.id,
    groupIds: article.groups.map((group) => group.groupId),
    content: article.content,
    title: article.title,
    summary: article.summary,
    createdBy: article.createdBy,
    updatedBy: article.updatedBy,
    aggregation: {
      commentsCount: article.commentsCount,
      totalUsersSeen: article.totalUsersSeen,
    },
    type: article.type,
    status: article.status,
    isHidden: article.isHidden,
    isReported: article.isReported,
    privacy: article.privacy,
    setting: {
      canComment: article.canComment,
      canReact: article.canReact,
      importantExpiredAt: article.importantExpiredAt,
      isImportant: article.isImportant,
    },
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    seriesIds: article.series.map((series) => series.id),
    tags: article.tags.map((tag) => createMockTagEntity(tag)),
    cover: createMockImageEntity(article.coverJson),
    categories: article.categories.map((category) => createMockCategoryEntity(category)),
    wordCount: article.wordCount,
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
    commentsCount: 3,
    totalUsersSeen: 14,
    isImportant: false,
    importantExpiredAt: null,
    canComment: true,
    canReact: true,
    isHidden: false,
    isReported: false,
    content: null,
    title: '1111',
    mentions: [],
    type: CONTENT_TYPE.SERIES,
    summary: '1111',
    privacy: PRIVACY.OPEN,
    tagsJson: [],
    createdBy: ownerId,
    updatedBy: ownerId,
    linkPreviewId: null,
    status: CONTENT_STATUS.PUBLISHED,
    publishedAt: now,
    groups: [{ groupId: v4(), postId: seriesId }],
    createdAt: now,
    updatedAt: now,
    tags: [],
    itemIds: [],
    coverJson: {
      height: 298,
      id: coverId,
      mime_type: 'image/jpeg',
      url: `https://media.beincom.app/image/variants/post/content/${coverId}`,
      width: 166,
    },
    ...data,
  };
}

export function createMockSeriesEntity(data: Partial<PostAttributes> = {}): SeriesEntity {
  const series = createMockSeriesRecord(data);
  return new SeriesEntity({
    id: series.id,
    groupIds: series.groups.map((group) => group.groupId),
    title: series.title,
    summary: series.summary,
    itemIds: series.itemIds.map((item) => item.postId),
    cover: series.coverJson ? createMockImageEntity(series.coverJson) : null,
    isHidden: series.isHidden,
    isReported: series.isReported,
    type: CONTENT_TYPE.SERIES,
    privacy: series.privacy,
    status: series.status,
    setting: {
      canComment: series.canComment,
      canReact: series.canReact,
      importantExpiredAt: series.importantExpiredAt,
      isImportant: series.isImportant,
    },
    createdBy: series.createdBy,
    updatedBy: series.updatedBy,
    createdAt: series.createdAt,
    updatedAt: series.updatedAt,
  });
}
