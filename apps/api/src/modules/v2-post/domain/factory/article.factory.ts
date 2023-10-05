import { CONTENT_STATUS, CONTENT_TYPE } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { v4 } from 'uuid';

import { ArticleEntity, ArticleAttributes } from '../model/content';

import { IArticleFactory } from './interface';

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
      type: CONTENT_TYPE.ARTICLE,
      status: CONTENT_STATUS.DRAFT,
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

  public reconstitute(properties: ArticleAttributes): ArticleEntity {
    return this._eventPublisher.mergeObjectContext(new ArticleEntity(properties));
  }
}
