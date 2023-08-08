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

  public setCover(coverMedia: ImageEntity): void {
    this._props.cover = coverMedia;
  }

  public getTitle(): string {
    return this._props.title;
  }

  /**
   * Note: Summary can be empty string
   */
  public updateAttribute(data: Partial<SeriesAttributes>, userId: string): void {
    const { title, summary } = data;
    this._props.updatedAt = new Date();
    this._props.updatedBy = userId;

    if (title) this._props.title = title;
    if (summary !== undefined) this._props.summary = summary;
  }
}
