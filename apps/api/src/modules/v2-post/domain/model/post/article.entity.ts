import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { ImageEntity } from '../media';
import { PostProps } from './post.entity';
import { CategoryEntity } from '../category';

export type ArticleProps = Omit<PostProps, 'mentionUserIds' | 'media'> & {
  title: string;
  summary: string[];
  categories: CategoryEntity[];
  cover: ImageEntity;
};

export class ArticleEntity extends DomainAggregateRoot<ArticleProps> {
  public constructor(props: ArticleProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`Group ID must be UUID`);
    }
    if (!isUUID(this._props.createdBy)) {
      throw new DomainModelException(`Created By must be UUID`);
    }
    if (!isUUID(this._props.updatedBy)) {
      throw new DomainModelException(`Updated By must be UUID`);
    }
  }
}
