import { CONTENT_TYPE } from '@beincom/constants';
import { PostAttributes, PostModel } from '@libs/database/postgres/model/post.model';

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
import { LinkPreviewEntity } from '../../domain/model/link-preview';
import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';
import { QuizEntity, QuizQuestionEntity } from '../../domain/model/quiz';
import { QuizParticipantEntity } from '../../domain/model/quiz-participant';
import { TagEntity } from '../../domain/model/tag';

export class ContentMapper {
  public toDomain(post: PostModel): PostEntity | ArticleEntity | SeriesEntity {
    if (post === null) {
      return null;
    }

    post = post.toJSON();
    switch (post.type) {
      case CONTENT_TYPE.POST:
        return this._modelToPostEntity(post);
      case CONTENT_TYPE.SERIES:
        return this._modelToSeriesEntity(post);
      case CONTENT_TYPE.ARTICLE:
        return this._modelToArticleEntity(post);
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

  private _modelToPostEntity(post: PostAttributes): PostEntity {
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
      quiz: post.quiz
        ? new QuizEntity({
            ...post.quiz,
            contentId: post.quiz.postId,
            questions: (post.quiz.questions || []).map(
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

  private _modelToArticleEntity(post: PostAttributes): ArticleEntity {
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
      quiz: post.quiz
        ? new QuizEntity({
            ...post.quiz,
            contentId: post.quiz.postId,
            questions: (post.quiz.questions || []).map(
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
}
