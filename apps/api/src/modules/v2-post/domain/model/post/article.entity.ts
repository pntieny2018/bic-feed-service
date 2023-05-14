import { ImageEntity } from '../media';
import { CategoryEntity } from '../category';
import { ContentEntity, ContentProps } from './content.entity';

export type ArticleProps = ContentProps & {
  title: string;
  summary: string;
  categories: CategoryEntity[];
  cover: ImageEntity;
  seriesIds: string[];
  tagsIds: string[];
};

export class ArticleEntity extends ContentEntity<ArticleProps> {
  public constructor(props: ArticleProps) {
    super(props);
  }
}
