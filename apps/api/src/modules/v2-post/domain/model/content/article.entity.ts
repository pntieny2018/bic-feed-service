import { ImageEntity } from '../media';
import { CategoryEntity } from '../category';
import { ContentEntity, ContentProps } from './content.entity';

export type ArticleProps = ContentProps & {
  title: string;
  summary: string;
  categories: CategoryEntity[];
  cover: ImageEntity;
  seriesIds: string[];
  tags: {
    id: string;
    name?: string;
    slug?: string;
  }[];
};

export class ArticleEntity extends ContentEntity<ArticleProps> {
  public constructor(props: ArticleProps) {
    super(props);
  }
}
