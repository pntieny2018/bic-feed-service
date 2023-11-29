import { CONTENT_STATUS, CONTENT_TYPE } from '@beincom/constants';
import { v4 } from 'uuid';

import { ImageEntity } from '../media';

import { ContentEntity, ContentAttributes } from './content.entity';

export type SeriesAttributes = ContentAttributes & {
  title: string;
  summary: string;
  itemIds?: string[];
  cover: ImageEntity;
};

export class SeriesEntity extends ContentEntity<SeriesAttributes> {
  public constructor(props: SeriesAttributes) {
    super(props);
  }

  public static create(props: Partial<SeriesAttributes>, userId: string): SeriesEntity {
    const { title, summary } = props;
    const now = new Date();
    return new SeriesEntity({
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
  }

  public setCover(coverMedia: ImageEntity): void {
    this._props.cover = coverMedia;
  }

  public getTitle(): string {
    return this._props.title;
  }

  public getItemIds(): string[] {
    return this._props.itemIds || [];
  }

  /**
   * Note: Summary can be empty string
   */
  public updateAttribute(data: Partial<SeriesAttributes>, userId: string): void {
    const { title, summary } = data;
    this._props.updatedAt = new Date();
    this._props.updatedBy = userId;

    if (title) {
      this._props.title = title;
    }
    if (summary !== undefined) {
      this._props.summary = summary;
    }
  }
}
