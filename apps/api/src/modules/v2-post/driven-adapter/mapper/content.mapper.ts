import { ReactionsCount } from '@api/common/types';
import {
  ArticleCacheDto,
  ImageDto,
  LinkPreviewDto,
  PostCacheDto,
  SeriesCacheDto,
  TagDto,
} from '@api/modules/v2-post/application/dto';
import { MediaMapper } from '@api/modules/v2-post/driven-adapter/mapper/media.mapper';
import { QuizMapper } from '@api/modules/v2-post/driven-adapter/mapper/quiz.mapper';
import { CONTENT_TYPE } from '@beincom/constants';
import { StringHelper } from '@libs/common/helpers';
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
  public constructor(
    private readonly _quizMapper: QuizMapper,
    private readonly _mediaMapper: MediaMapper
  ) {}

  public toDomain(
    post: PostModel,
    reactionsCountMap?: Map<string, ReactionsCount>
  ): PostEntity | ArticleEntity | SeriesEntity {
    if (post === null) {
      return null;
    }

    post = post.toJSON();
    switch (post.type) {
      case CONTENT_TYPE.POST:
        return this._modelToPostEntity(post, reactionsCountMap);
      case CONTENT_TYPE.SERIES:
        return this._modelToSeriesEntity(post);
      case CONTENT_TYPE.ARTICLE:
        return this._modelToArticleEntity(post, reactionsCountMap);
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

  public async contentsCacheBinding(
    contentEntities: (PostEntity | SeriesEntity | ArticleEntity)[]
  ): Promise<(ArticleCacheDto | PostCacheDto | SeriesCacheDto)[]> {
    const result = [];
    for (const content of contentEntities) {
      if (content instanceof PostEntity) {
        result.push(this._bindingPostCache(content));
      }
      if (content instanceof ArticleEntity) {
        result.push(this._bindingArticleCache(content));
      }

      if (content instanceof SeriesEntity) {
        result.push(this._bindingSeriesCache(content));
      }
    }

    return result;
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

  private _modelToPostEntity(
    post: PostAttributes,
    reactionsCountMap?: Map<string, ReactionsCount>
  ): PostEntity {
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
        ...(reactionsCountMap && { reactionsCount: merge({}, ...reactionsCountMap.get(post.id)) }),
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
    reactionsCountMap?: Map<string, ReactionsCount>
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
        ...(reactionsCountMap && { reactionsCount: merge({}, ...reactionsCountMap.get(post.id)) }),
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
      title: StringHelper.getRawTextFromMarkdown(post.content).slice(0, 500),
      updatedAt: post.updatedAt,
      updatedBy: post.updatedBy,
      createdBy: post.createdBy,
      privacy: post.privacy,
      status: post.status,
      type: post.type,
      setting: post.setting,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
      groupIds: post.groups,
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
      mentionUserIds: post.mentionsUserId || [],
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
      groupIds: article.groups,
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
      groupIds: series.groups,
      title: series.title,
      summary: series.summary,
      itemIds: series.itemsIds || [],
      cover: series.coverMedia ? new ImageEntity(series.coverMedia) : null,
    });
  }

  private _bindingPostCache(postEntity: PostEntity): PostCacheDto {
    return new PostCacheDto({
      id: postEntity.getId(),
      isHidden: postEntity.isHidden(),
      isReported: postEntity.get('isReported'),
      commentsCount: postEntity.get('aggregation')?.commentsCount || 0,
      content: postEntity.getContent(),
      title: postEntity.get('title'),
      createdAt: postEntity.get('createdAt'),
      updatedAt: postEntity.get('updatedAt'),
      createdBy: postEntity.getCreatedBy(),
      updatedBy: postEntity.get('updatedBy'),
      groups: postEntity.getGroupIds(),
      linkPreview: this._getLinkPreviewBindingInContent(postEntity.get('linkPreview')),
      media: this._mediaMapper.toDto(postEntity.get('media')),
      mentionsUserId: postEntity.get('mentionUserIds'),
      privacy: postEntity.get('privacy'),
      publishedAt: postEntity.get('publishedAt'),
      reactionsCount: postEntity.get('aggregation')?.reactionsCount,
      setting: postEntity.get('setting'),
      status: postEntity.get('status'),
      tags: postEntity.getTags().map((tagEntity) => this._getTagBindingInContent(tagEntity)),
      totalUsersSeen: postEntity.get('aggregation')?.totalUsersSeen || 0,
      type: postEntity.getType(),
      seriesIds: postEntity.getSeriesIds(),
      quiz: postEntity.get('quiz') ? this._quizMapper.toDto(postEntity.get('quiz')) : undefined,
    });
  }

  private _bindingArticleCache(articleEntity: ArticleEntity): ArticleCacheDto {
    return new ArticleCacheDto({
      categories: articleEntity.getCategories().map((category) => ({
        id: category.get('id'),
        name: category.get('name'),
      })),
      commentsCount: articleEntity.get('aggregation')?.commentsCount || 0,
      content: articleEntity.get('content'),
      coverMedia: new ImageDto(articleEntity.get('cover')?.toObject()),
      createdAt: articleEntity.get('createdAt'),
      createdBy: articleEntity.getCreatedBy(),
      updatedBy: articleEntity.get('updatedBy'),
      groups: articleEntity.getGroupIds(),
      id: articleEntity.getId(),
      isReported: articleEntity.get('isReported'),
      isHidden: articleEntity.isHidden(),
      media: this._mediaMapper.toDto(articleEntity.get('media')),
      privacy: articleEntity.get('privacy'),
      publishedAt: articleEntity.get('publishedAt'),
      reactionsCount: articleEntity.get('aggregation')?.reactionsCount,
      seriesIds: articleEntity.getSeriesIds(),
      setting: articleEntity.get('setting'),
      status: articleEntity.get('status'),
      summary: articleEntity.get('summary'),
      tags: articleEntity.getTags().map((tagEntity) => this._getTagBindingInContent(tagEntity)),
      title: articleEntity.get('title'),
      totalUsersSeen: articleEntity.get('aggregation')?.totalUsersSeen || 0,
      type: articleEntity.getType(),
      updatedAt: articleEntity.get('updatedAt'),
      wordCount: articleEntity.get('wordCount'),
      quiz: articleEntity.get('quiz')
        ? this._quizMapper.toDto(articleEntity.get('quiz'))
        : undefined,
    });
  }

  private _bindingSeriesCache(seriesEntity: SeriesEntity): SeriesCacheDto {
    return new SeriesCacheDto({
      coverMedia: new ImageDto(seriesEntity.get('cover')?.toObject()),
      createdAt: seriesEntity.get('createdAt'),
      updatedAt: seriesEntity.get('updatedAt'),
      updatedBy: seriesEntity.get('updatedBy'),
      createdBy: seriesEntity.getCreatedBy(),
      isHidden: seriesEntity.isHidden(),
      isReported: seriesEntity.get('isReported'),
      groups: seriesEntity.getGroupIds(),
      id: seriesEntity.getId(),
      itemsIds: seriesEntity.getItemIds(),
      privacy: seriesEntity.get('privacy'),
      publishedAt: seriesEntity.get('publishedAt'),
      setting: seriesEntity.get('setting'),
      status: seriesEntity.get('status'),
      summary: seriesEntity.get('summary'),
      title: seriesEntity.get('title'),
      type: seriesEntity.getType(),
    });
  }

  private _getLinkPreviewBindingInContent(linkPreviewEntity: LinkPreviewEntity): LinkPreviewDto {
    if (!linkPreviewEntity) {
      return null;
    }
    return {
      id: linkPreviewEntity.get('id'),
      url: linkPreviewEntity.get('url'),
      domain: linkPreviewEntity.get('domain'),
      image: linkPreviewEntity.get('image'),
      title: linkPreviewEntity.get('title'),
      description: linkPreviewEntity.get('description'),
    };
  }

  private _getTagBindingInContent(tagEntity: TagEntity): TagDto {
    if (!tagEntity) {
      return null;
    }
    return {
      id: tagEntity.get('id'),
      groupId: tagEntity.get('groupId'),
      name: tagEntity.get('name'),
    };
  }
}
