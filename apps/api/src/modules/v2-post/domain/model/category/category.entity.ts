import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

export type CategoryProps = {
  id: string;
  parentId: string;
  name: string;
  slug?: string;
  level: number;
  zindex: number;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export class CategoryEntity extends DomainAggregateRoot<CategoryProps> {
  public constructor(props: CategoryProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`Category ID must be UUID`);
    }
  }
}
