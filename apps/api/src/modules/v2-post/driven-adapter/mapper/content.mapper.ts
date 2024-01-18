import {
  ArticleCacheDto,
  FileDto,
  ImageDto,
  LinkPreviewDto,
  PostCacheDto,
  QuizDto,
  ReactionCount,
  SeriesCacheDto,
  TagDto,
  VideoDto,
} from '@api/modules/v2-post/application/dto';
import { CONTENT_TYPE } from '@beincom/constants';
import { QuizAttributes, TagAttributes } from '@libs/database/postgres/model';
import { PostAttributes, PostModel } from '@libs/database/postgres/model/post.model';
import { Injectable } from '@nestjs/common';
import { merge } from 'lodash';

import { CategoryEntity } from '../../domain/model/category';
import {
  ArticleEntity,
  ContentEntity,
  PostEntity,
  SeriesEntity,
  ContentAttributes,
  PostAttributes as PostEntityAttributes,
  ArticleAttributes as ArticleEntityAttributes,
  SeriesAttributes as SeriesEntityAttributes,
} from '../../domain/model/content';
import { LinkPreviewAttributes, LinkPreviewEntity } from '../../domain/model/link-preview';
import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';
import { QuizEntity, QuizQuestionAttributes, QuizQuestionEntity } from '../../domain/model/quiz';
import { QuizParticipantEntity } from '../../domain/model/quiz-participant';
import { TagEntity } from '../../domain/model/tag';

@Injectable()
export class ContentMapper {
  public toDomain(
    post: PostModel,
    reactionsCount?: ReactionCount[]
  ): PostEntity | ArticleEntity | SeriesEntity {
    if (post === null) {
      return null;
    }

    post = post.toJSON();
    switch (post.type) {
      case CONTENT_TYPE.POST:
        return this._modelToPostEntity(post, reactionsCount);
      case CONTENT_TYPE.SERIES:
        return this._modelToSeriesEntity(post);
      case CONTENT_TYPE.ARTICLE:
        return this._modelToArticleEntity(post, reactionsCount);
      default:
        return null;
    }
  }

  public cacheToDomain(
    content: PostCacheDto | ArticleCacheDto | SeriesCacheDto
  ): PostEntity | ArticleEntity | SeriesEntity {
    if (content === null) {
      return null;
    }

    switch (content.type) {
      case CONTENT_TYPE.POST:
        return this._cacheToPostEntity(content as PostCacheDto);
      case CONTENT_TYPE.SERIES:
        return this._cacheToSeriesEntity(content as SeriesCacheDto);
      case CONTENT_TYPE.ARTICLE:
        return this._cacheToArticleEntity(content as ArticleCacheDto);
      default:
        return null;
    }
  }

  public modelToCache(
    post: PostModel,
    reactionsCount?: ReactionCount[]
  ): ArticleCacheDto | PostCacheDto | SeriesCacheDto {
    if (post === null) {
      return null;
    }

    post = post.toJSON();
    switch (post.type) {
      case CONTENT_TYPE.POST:
        return this._modelToPostCache(post, reactionsCount);
      case CONTENT_TYPE.SERIES:
        return this._modelToSeriesCache(post);
      case CONTENT_TYPE.ARTICLE:
        return this._modelToArticleCache(post, reactionsCount);
      default:
        return null;
    }
  }

  public toPersistence<
    T extends ContentEntity<P & ContentAttributes>,
    P = PostEntityAttributes | ArticleEntityAttributes | SeriesEntityAttributes
  >(postEntity: T): PostAttributes {
    return {
      id: postEntity.getId(),
      commentsCount: postEntity.get('aggregation')?.commentsCount || 0,
      totalUsersSeen: postEntity.get('aggregation')?.totalUsersSeen || 0,
      wordCount: postEntity.get('wordCount') || 0,
      isImportant: postEntity.get('setting')?.isImportant,
      importantExpiredAt: postEntity.get('setting')?.importantExpiredAt || null,
      canComment: postEntity.get('setting')?.canComment,
      canReact: postEntity.get('setting')?.canReact,
      isHidden: postEntity.get('isHidden'),
      isReported: postEntity.get('isReported'),
      content: postEntity.get('content' as keyof ContentAttributes),
      title: postEntity.get('title' as keyof ContentAttributes),
      mentions: postEntity.get('mentionUserIds' as keyof ContentAttributes) || [],
      type: postEntity.get('type'),
      summary: postEntity.get('summary' as keyof ContentAttributes),
      lang: postEntity.get('lang'),
      privacy: postEntity.get('privacy'),
      tagsJson:
        postEntity
          .get('tags' as keyof ContentAttributes)
          ?.map((tag: TagEntity) => tag.toObject()) || [],
      createdBy: postEntity.get('createdBy'),
      updatedBy: postEntity.get('updatedBy'),
      linkPreviewId: postEntity.get('linkPreview' as keyof ContentAttributes)
        ? postEntity.get('linkPreview' as keyof ContentAttributes)?.get('id')
        : null,
      videoIdProcessing: postEntity.get('videoIdProcessing' as keyof ContentAttributes) || null,
      cover: postEntity.get('cover' as keyof ContentAttributes)?.id || null,
      status: postEntity.get('status'),
      publishedAt: postEntity.get('publishedAt') || null,
      scheduledAt: postEntity.get('scheduledAt') || null,
      errorLog: postEntity.get('errorLog'),
      coverJson: postEntity.get('cover' as keyof ContentAttributes)
        ? postEntity.get('cover' as keyof ContentAttributes).toObject()
        : null,
      mediaJson: {
        files: (postEntity.get('media')?.files || []).map((file) => file.toObject()),
        images: (postEntity.get('media')?.images || []).map((image) => image.toObject()),
        videos: (postEntity.get('media')?.videos || []).map((video) => video.toObject()),
      },
      createdAt: postEntity.get('createdAt'),
      updatedAt: postEntity.get('updatedAt'),
      linkPreview: postEntity.get('linkPreview' as keyof ContentAttributes)
        ? postEntity.get('linkPreview' as keyof ContentAttributes).toObject()
        : null,
    };
  }

  private _modelToPostEntity(post: PostAttributes, reactionsCount?: ReactionCount[]): PostEntity {
    if (post === null) {
      return null;
    }
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
      scheduledAt: post.scheduledAt || null,
      lang: post.lang,
      groupIds: (post.groups || []).map((group) => group.groupId),
      postGroups: post.groups || [],
      quiz: post.quiz?.[0]
        ? new QuizEntity({
            ...post.quiz[0],
            contentId: post.quiz[0].postId,
            questions: (post.quiz[0].questions || []).map(
              (question) => new QuizQuestionEntity(question)
            ),
          })
        : undefined,
      quizResults: (post.quizResults || []).map(
        (quizResult) => new QuizParticipantEntity({ ...quizResult, contentId: quizResult.postId })
      ),
      wordCount: post.wordCount,
      aggregation: {
        commentsCount: post.commentsCount,
        totalUsersSeen: post.totalUsersSeen,
        reactionsCount: reactionsCount ? merge({}, ...reactionsCount) : undefined,
      },
      media: {
        images: (post.mediaJson?.images || []).map((image) => new ImageEntity(image)),
        files: (post.mediaJson?.files || []).map((file) => new FileEntity(file)),
        videos: (post.mediaJson?.videos || []).map((video) => new VideoEntity(video)),
      },
      title: post.title,
      content: post.content,
      mentionUserIds: post.mentions || [],
      linkPreview: post.linkPreview ? new LinkPreviewEntity(post.linkPreview) : undefined,
      seriesIds: post.seriesIds || [],
      tags: (post.tagsJson || []).map((tag) => new TagEntity(tag)),
      videoIdProcessing: post.videoIdProcessing || null,
    });
  }

  private _modelToArticleEntity(
    post: PostAttributes,
    reactionsCount?: ReactionCount[]
  ): ArticleEntity {
    if (post === null) {
      return null;
    }
    return new ArticleEntity({
      id: post.id,
      isReported: post.isReported,
      isHidden: post.isHidden,
      isSeen: post.isSeen || false,
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
      quiz: post.quiz?.[0]
        ? new QuizEntity({
            ...post.quiz[0],
            contentId: post.quiz[0].postId,
            questions: (post.quiz[0].questions || []).map(
              (question) => new QuizQuestionEntity(question)
            ),
          })
        : undefined,
      quizResults: (post.quizResults || []).map(
        (quizResult) => new QuizParticipantEntity({ ...quizResult, contentId: quizResult.postId })
      ),
      wordCount: post.wordCount,
      aggregation: {
        commentsCount: post.commentsCount,
        totalUsersSeen: post.totalUsersSeen,
        reactionsCount: reactionsCount ? merge({}, ...reactionsCount) : undefined,
      },
      title: post.title,
      summary: post.summary,
      content: post.content,
      categories: (post.categories || []).map((category) => new CategoryEntity(category)),
      cover: post.coverJson ? new ImageEntity(post.coverJson) : null,
      seriesIds: post.seriesIds || [],
      tags: (post.tagsJson || []).map((tag) => new TagEntity(tag)),
    });
  }

  private _modelToSeriesEntity(post: PostAttributes): SeriesEntity {
    if (post === null) {
      return null;
    }
    return new SeriesEntity({
      id: post.id,
      isReported: post.isReported,
      isSeen: post.isSeen || false,
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
      errorLog: post.errorLog,
      publishedAt: post.publishedAt,
      lang: post.lang,
      groupIds: (post.groups || []).map((group) => group.groupId),
      postGroups: post.groups || [],
      title: post.title,
      summary: post.summary,
      itemIds: post.itemIds || [],
      cover: post.coverJson ? new ImageEntity(post.coverJson) : null,
    });
  }

  private _cacheToPostEntity(post: PostCacheDto): PostEntity {
    if (post === null) {
      return null;
    }
    return new PostEntity({
      id: post.id,
      isHidden: post.isHidden,
      isReported: post.isReported,
      title: post.title,
      updatedAt: post.updatedAt,
      updatedBy: post.updatedBy,
      createdBy: post.createdBy,
      privacy: post.privacy,
      status: post.status,
      type: post.type,
      setting: post.setting,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
      groupIds: post.groupIds,
      aggregation: {
        commentsCount: post.commentsCount,
        totalUsersSeen: post.totalUsersSeen,
        reactionsCount: post.reactionsCount,
      },
      media: {
        images: (post.media.images || []).map((image) => new ImageEntity(image)),
        files: (post.media.files || []).map((file) => new FileEntity(file)),
        videos: (post.media.videos || []).map((video) => new VideoEntity(video)),
      },
      quiz: post.quiz
        ? new QuizEntity({
            ...post.quiz,
            contentId: post.id,
            questions: (post.quiz.questions || []).map(
              (question) => new QuizQuestionEntity(question as QuizQuestionAttributes)
            ),
          })
        : undefined,
      content: post.content,
      mentionUserIds: post.mentionsUserIds || [],
      linkPreview: post.linkPreview
        ? new LinkPreviewEntity(post.linkPreview as LinkPreviewAttributes)
        : undefined,
      seriesIds: post.seriesIds || [],
      tags: post.tags ? post.tags.map((tag) => new TagEntity(tag)) : [],
    });
  }

  private _cacheToArticleEntity(article: ArticleCacheDto): ArticleEntity {
    if (article === null) {
      return null;
    }
    return new ArticleEntity({
      id: article.id,
      isHidden: article.isHidden,
      isReported: article.isReported,
      title: article.title,
      updatedAt: article.updatedAt,
      updatedBy: article.updatedBy,
      createdBy: article.createdBy,
      privacy: article.privacy,
      status: article.status,
      type: article.type,
      setting: article.setting,
      createdAt: article.createdAt,
      publishedAt: article.publishedAt,
      groupIds: article.groupIds,
      aggregation: {
        commentsCount: article.commentsCount,
        totalUsersSeen: article.totalUsersSeen,
        reactionsCount: article.reactionsCount,
      },
      media: {
        images: (article.media.images || []).map((image) => new ImageEntity(image)),
        files: (article.media.files || []).map((file) => new FileEntity(file)),
        videos: (article.media.videos || []).map((video) => new VideoEntity(video)),
      },
      content: article.content,
      summary: article.summary,
      categories: article.categories
        ? article.categories.map((category) => new CategoryEntity(category))
        : [],
      quiz: article.quiz
        ? new QuizEntity({
            ...article.quiz,
            contentId: article.id,
            questions: (article.quiz.questions || []).map(
              (question) => new QuizQuestionEntity(question as QuizQuestionAttributes)
            ),
          })
        : undefined,
      cover: article.coverMedia ? new ImageEntity(article.coverMedia) : null,
      seriesIds: article.seriesIds || [],
      tags: article.tags ? article.tags.map((tag) => new TagEntity(tag)) : [],
    });
  }

  private _cacheToSeriesEntity(series: SeriesCacheDto): SeriesEntity {
    if (series === null) {
      return null;
    }
    return new SeriesEntity({
      id: series.id,
      isReported: series.isReported,
      isHidden: series.isHidden,
      createdBy: series.createdBy,
      updatedBy: series.updatedBy,
      privacy: series.privacy,
      status: series.status,
      type: series.type,
      setting: series.setting,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
      publishedAt: series.publishedAt,
      groupIds: series.groupIds,
      title: series.title,
      summary: series.summary,
      itemIds: series.itemsIds || [],
      cover: series.coverMedia ? new ImageEntity(series.coverMedia) : null,
    });
  }

  private _modelToPostCache(
    post: PostAttributes,
    reactionsCount: ReactionCount[] = []
  ): PostCacheDto {
    return new PostCacheDto({
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
      media: {
        images: (post.mediaJson?.images || []).map((image) => new ImageDto(image)),
        files: (post.mediaJson?.files || []).map((file) => new FileDto(file)),
        videos: (post.mediaJson?.videos || []).map((video) => new VideoDto(video)),
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      publishedAt: post.publishedAt,
      groupIds: (post.groups || []).map((group) => group.groupId),
      title: post.title,
      content: post.content,
      reactionsCount: merge({}, ...reactionsCount),
      commentsCount: post.commentsCount || 0,
      totalUsersSeen: post.totalUsersSeen || 0,
      mentionsUserIds: post.mentions || [],
      seriesIds: post.seriesIds || [],
      tags: (post.tagsJson || []).map((tag) => this._modelToTagDto(tag)),
      linkPreview: post.linkPreview ? new LinkPreviewDto(post.linkPreview) : null,
      quiz: this._modelToQuizDto(post.quiz?.[0]),
    });
  }

  private _modelToArticleCache(
    post: PostAttributes,
    reactionsCount: ReactionCount[] = []
  ): ArticleCacheDto {
    return new ArticleCacheDto({
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
      media: {
        images: (post.mediaJson?.images || []).map((image) => new ImageDto(image)),
        files: (post.mediaJson?.files || []).map((file) => new FileDto(file)),
        videos: (post.mediaJson?.videos || []).map((video) => new VideoDto(video)),
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      publishedAt: post.publishedAt,
      groupIds: (post.groups || []).map((group) => group.groupId),
      title: post.title,
      content: post.content,
      summary: post.summary,
      reactionsCount: merge({}, ...reactionsCount),
      wordCount: post.wordCount || 0,
      commentsCount: post.commentsCount || 0,
      totalUsersSeen: post.totalUsersSeen || 0,
      categories: (post.categories || []).map((category) => ({
        id: category.id,
        name: category.name,
      })),
      coverMedia: post.coverJson ? new ImageDto(post.coverJson) : null,
      seriesIds: post.seriesIds || [],
      tags: (post.tagsJson || []).map((tag) => this._modelToTagDto(tag)),
      quiz: this._modelToQuizDto(post.quiz?.[0]),
    });
  }

  private _modelToSeriesCache(post: PostAttributes): SeriesCacheDto {
    return new SeriesCacheDto({
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
      publishedAt: post.publishedAt,
      groupIds: (post.groups || []).map((group) => group.groupId),
      title: post.title,
      summary: post.summary,
      itemsIds: post.itemIds || [],
      coverMedia: post.coverJson ? new ImageDto(post.coverJson) : null,
    });
  }

  private _modelToQuizDto(quiz: QuizAttributes): QuizDto {
    if (!quiz) {
      return null;
    }
    return {
      id: quiz.id,
      contentId: quiz.postId,
      numberOfQuestions: quiz.numberOfQuestions,
      numberOfAnswers: quiz.numberOfAnswers,
      isRandom: quiz.isRandom,
      title: quiz.title,
      description: quiz.description,
      numberOfQuestionsDisplay: quiz.numberOfQuestionsDisplay,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      status: quiz.status,
      genStatus: quiz.genStatus,
      createdBy: quiz.createdBy,
      timeLimit: quiz.timeLimit,
    };
  }

  private _modelToTagDto(tag: TagAttributes): TagDto {
    if (!tag) {
      return null;
    }
    return {
      id: tag.id,
      groupId: tag.groupId,
      name: tag.name,
      slug: tag.slug,
    };
  }
}
