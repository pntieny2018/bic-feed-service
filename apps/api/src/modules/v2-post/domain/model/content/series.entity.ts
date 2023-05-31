import { ImageEntity } from '../media';
import { PostEntity } from './post.entity';
import { ArticleEntity } from './article.entity';
import { ContentEntity, ContentProps } from './content.entity';
import { UpdateSeriesCommandPayload } from '../../../application/command/update-series/update-series.command';

export type SeriesProps = ContentProps & {
  title: string;
  summary: string;
  items?: (PostEntity | ArticleEntity)[];
  cover: ImageEntity;
};

export class SeriesEntity extends ContentEntity<SeriesProps> {
  public constructor(props: SeriesProps) {
    super(props);
  }

  public setCover(coverMedia: ImageEntity): void {
    this._props.cover = coverMedia;
  }

  public updateAttribute(data: UpdateSeriesCommandPayload): void {
    const { actor, title, summary } = data;
    this._props.updatedAt = new Date();
    this._props.updatedBy = actor.id;
    if (title) this._props.title = title;
    if (summary) this._props.summary = summary;
  }
}
