import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { IArticleFactory } from './interface';
import { ArticleEntity, ArticleProps } from '../model/content';
import { v4 } from 'uuid';
import { PostStatus, PostType } from '../../data-type';

export class ArticleFactory implements IArticleFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public createArticle({
    groupIds,
    userId,
  }: {
    groupIds: string[];
    userId: string;
  }): ArticleEntity {
    const now = new Date();
    const entity = new ArticleEntity({
      id: v4(),
      groupIds,
      content: null,
      title: null,
      summary: null,
      createdBy: userId,
      updatedBy: userId,
      aggregation: {
        commentsCount: 0,
        totalUsersSeen: 0,
      },
      type: PostType.ARTICLE,
      status: PostStatus.DRAFT,
      isHidden: false,
      isReported: false,
      privacy: null,
      setting: {
        canComment: true,
        canReact: true,
        importantExpiredAt: null,
        isImportant: false,
      },
      createdAt: now,
      updatedAt: now,
      seriesIds: [],
      tags: [],
      categories: [],
      wordCount: 0,
      cover: null,
    });

    return this._eventPublisher.mergeObjectContext(entity);
  }

  public reconstitute(properties: ArticleProps): ArticleEntity {
    return this._eventPublisher.mergeObjectContext(new ArticleEntity(properties));
  }
}
