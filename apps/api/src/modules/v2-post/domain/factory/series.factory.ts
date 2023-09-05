import { CONTENT_STATUS, CONTENT_TYPE } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { EventPublisher } from '@nestjs/cqrs';
import { v4 } from 'uuid';

import { SeriesEntity, SeriesAttributes } from '../model/content';

import { BasedSeriesProps, ISeriesFactory } from './interface';

export class SeriesFactory implements ISeriesFactory {
  @Inject(EventPublisher) private readonly _eventPublisher: EventPublisher;

  public createSeries(props: BasedSeriesProps): SeriesEntity {
    const { userId, title, summary } = props;
    const now = new Date();
    const entity = new SeriesEntity({
      id: v4(),
      title,
      summary,
      createdBy: userId,
      updatedBy: userId,
      status: CONTENT_STATUS.PUBLISHED,
      type: CONTENT_TYPE.SERIES,
      setting: {
        canComment: true,
        canReact: true,
        importantExpiredAt: null,
        isImportant: false,
      },
      privacy: null,
      cover: null,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      isSaved: false,
      isReported: false,
      isHidden: false,
      aggregation: {
        commentsCount: 0,
        totalUsersSeen: 0,
      },
    });

    return this._eventPublisher.mergeObjectContext(entity);
  }

  public reconstitute(properties: SeriesAttributes): SeriesEntity {
    return this._eventPublisher.mergeObjectContext(new SeriesEntity(properties));
  }
}
