import { ImageEntity } from '../media';
import { PostEntity } from './post.entity';
import { ArticleEntity } from './article.entity';
import { ContentEntity, ContentProps } from './content.entity';

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
}
