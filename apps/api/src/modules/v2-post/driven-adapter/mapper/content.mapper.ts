import { CONTENT_STATUS, CONTENT_TYPE, LANGUAGE } from '@beincom/constants';
import { IImage } from '@libs/database/postgres/model/comment.model';
import { PostAttributes, PostModel } from '@libs/database/postgres/model/post.model';
import { Injectable } from '@nestjs/common';

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
import { FileEntity, ImageAttributes, ImageEntity, VideoEntity } from '../../domain/model/media';
import { QuizEntity } from '../../domain/model/quiz';
import { QuizParticipantEntity } from '../../domain/model/quiz-participant';
import { TagEntity } from '../../domain/model/tag';

@Injectable()
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
      wordCount: postEntity.get('wordCount'),
      isImportant: postEntity.get('setting')?.isImportant,
      importantExpiredAt: postEntity.get('setting')?.importantExpiredAt || null,
      canComment: postEntity.get('setting')?.canComment,
      canReact: postEntity.get('setting')?.canReact,
      isHidden: postEntity.get('isHidden'),
      isReported: postEntity.get('isReported'),
      content: postEntity.get('content' as keyof ContentAttributes),
      title: postEntity.get('title' as keyof ContentAttributes),
      mentions: postEntity.get('mentionUserIds' as keyof ContentAttributes) || [],
      type: postEntity.get('type') as unknown as CONTENT_TYPE,
      summary: postEntity.get('summary' as keyof ContentAttributes),
      lang: postEntity.get('lang') as LANGUAGE,
      privacy: postEntity.get('privacy' as keyof ContentAttributes),
      tagsJson:
        postEntity
          .get('tags' as keyof ContentAttributes)
          ?.map((tag: TagEntity) => tag.toObject()) || [],
      createdBy: postEntity.get('createdBy'),
      updatedBy: postEntity.get('updatedBy'),
      linkPreviewId: postEntity.get('linkPreview' as keyof ContentAttributes)
        ? postEntity.get('linkPreview' as keyof ContentAttributes)?.get('id')
        : null,
      videoIdProcessing: postEntity.get('videoIdProcessing' as keyof ContentAttributes),
      cover: (postEntity.get('cover' as keyof ContentAttributes) as ImageEntity)?.get('id'),
      status: postEntity.get('status') as unknown as CONTENT_STATUS,
      publishedAt: postEntity.get('publishedAt'),
      scheduledAt: postEntity.get('scheduledAt'),
      errorLog: postEntity.get('errorLog'),
      mediaJson: {
        files: (postEntity.get('media')?.files || []).map((file) => file.toObject()),
        images: (postEntity.get('media')?.images || []).map(
          (image) => image.toObject() as unknown as IImage
        ),
        videos: (postEntity.get('media')?.videos || []).map((video) => video.toObject()),
      },
      coverJson: postEntity.get('cover' as keyof ContentAttributes)?.toObject(),
      linkPreview: postEntity.get('linkPreview' as keyof ContentAttributes)?.toObject() || null,
      createdAt: postEntity.get('createdAt'),
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
      lang: post.lang,
      setting: {
        isImportant: post.isImportant,
        importantExpiredAt: post.importantExpiredAt,
        canComment: post.canComment,
        canReact: post.canReact,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      errorLog: post.errorLog,
      publishedAt: post.publishedAt,
      content: post.content,
      mentionUserIds: post.mentions || [],
      groupIds: post.groups?.map((group) => group.groupId),
      seriesIds: post.postSeries?.map((series) => series.seriesId),
      quiz: post.quiz
        ? new QuizEntity({
            id: post.quiz.id,
            contentId: post.quiz.postId,
            title: post.quiz.title,
            description: post.quiz.description,
            status: post.quiz.status,
            genStatus: post.quiz.genStatus,
            timeLimit: post.quiz.timeLimit,
            createdAt: post.quiz.createdAt,
            createdBy: post.quiz.createdBy,
          })
        : undefined,
      quizResults: (post.quizResults || []).map(
        (quizResult) =>
          new QuizParticipantEntity({
            id: quizResult.id,
            quizId: quizResult.quizId,
            contentId: quizResult.postId,
            quizSnapshot: quizResult.quizSnapshot,
            timeLimit: quizResult.timeLimit,
            score: quizResult.score,
            isHighest: quizResult.isHighest,
            totalAnswers: quizResult.totalAnswers,
            totalCorrectAnswers: quizResult.totalCorrectAnswers,
            startedAt: quizResult.startedAt,
            finishedAt: quizResult.finishedAt,
            answers: [],
            updatedBy: quizResult.updatedBy,
            updatedAt: quizResult.updatedAt,
            createdAt: quizResult.createdAt,
            createdBy: quizResult.createdBy,
          })
      ),
      tags: post.tagsJson?.map((tag) => new TagEntity(tag)),
      media: {
        images: post.mediaJson?.images.map(
          (image) => new ImageEntity(image as unknown as ImageAttributes)
        ),
        files: post.mediaJson?.files.map((file) => new FileEntity(file)),
        videos: post.mediaJson?.videos.map((video) => new VideoEntity(video)),
      },
      aggregation: {
        commentsCount: post.commentsCount,
        totalUsersSeen: post.totalUsersSeen,
      },
      linkPreview: post.linkPreview ? new LinkPreviewEntity(post.linkPreview) : undefined,
      videoIdProcessing: post.videoIdProcessing,
      markedReadImportant: post.markedReadPost,
      isSaved: post.isSaved || false,
      ownerReactions: post.postReactions
        ? post.postReactions.map((item) => ({
            id: item.id,
            reactionName: item.reactionName,
          }))
        : undefined,
    });
  }

  private _modelToArticleEntity(post: PostAttributes): ArticleEntity {
    if (post === null) {
      return null;
    }
    return new ArticleEntity({
      id: post.id,
      content: post.content,
      isReported: post.isReported,
      isHidden: post.isHidden,
      createdBy: post.createdBy,
      updatedBy: post.updatedBy,
      privacy: post.privacy,
      status: post.status,
      type: post.type,
      title: post.title,
      summary: post.summary,
      lang: post.lang,
      setting: {
        isImportant: post.isImportant,
        importantExpiredAt: post.importantExpiredAt,
        canComment: post.canComment,
        canReact: post.canReact,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      errorLog: post.errorLog,
      publishedAt: post.publishedAt,
      scheduledAt: post.scheduledAt,
      categories: post.categories?.map((category) => new CategoryEntity(category)),
      groupIds: post.groups?.map((group) => group.groupId),
      seriesIds: post.postSeries?.map((series) => series.seriesId),
      quiz: post.quiz
        ? new QuizEntity({
            id: post.quiz.id,
            contentId: post.quiz.postId,
            title: post.quiz.title,
            description: post.quiz.description,
            status: post.quiz.status,
            genStatus: post.quiz.genStatus,
            timeLimit: post.quiz.timeLimit,
            createdAt: post.quiz.createdAt,
            createdBy: post.quiz.createdBy,
          })
        : undefined,
      tags: post.tagsJson?.map((tag) => new TagEntity(tag)),
      aggregation: {
        commentsCount: post.commentsCount,
        totalUsersSeen: post.totalUsersSeen,
      },
      cover: post.coverJson ? new ImageEntity(post.coverJson) : null,
      wordCount: post.wordCount,
      markedReadImportant: post.markedReadPost,
      isSaved: post.isSaved || false,
      ownerReactions: post.postReactions
        ? post.postReactions.map((item) => ({
            id: item.id,
            reactionName: item.reactionName,
          }))
        : undefined,
    });
  }

  private _modelToSeriesEntity(post: PostAttributes): SeriesEntity {
    if (post === null) {
      return null;
    }
    return new SeriesEntity({
      id: post.id,
      isReported: post.isReported,
      isHidden: post.isHidden,
      createdBy: post.createdBy,
      updatedBy: post.updatedBy,
      privacy: post.privacy,
      status: post.status,
      type: post.type,
      title: post.title,
      summary: post.summary,
      lang: post.lang,
      setting: {
        isImportant: post.isImportant,
        importantExpiredAt: post.importantExpiredAt,
        canComment: post.canComment,
        canReact: post.canReact,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      errorLog: post.errorLog,
      publishedAt: post.publishedAt,
      groupIds: post.groups?.map((group) => group.groupId),
      cover: post.coverJson ? new ImageEntity(post.coverJson) : null,
      markedReadImportant: post.markedReadPost,
      isSaved: post.isSaved || false,
      itemIds:
        post.itemIds
          ?.sort((a, b) => {
            return a.zindex - b.zindex;
          })
          .map((item) => item.postId) || [],
    });
  }
}
