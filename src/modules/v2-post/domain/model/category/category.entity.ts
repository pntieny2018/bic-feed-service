import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

export type CategoryProps = {
  id: string;
  name: string;
  level: number;
  parentId?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  slug: string;
  totalUsed: number;
};

export class CategoryEntity extends DomainAggregateRoot<CategoryProps> {
  public constructor(props: CategoryProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`Category ID is not UUID`);
    }
    if (!isUUID(this._props.createdBy)) {
      throw new DomainModelException(`Created By is not UUID`);
    }
    if (!isUUID(this._props.updatedBy)) {
      throw new DomainModelException(`Updated By is not UUID`);
    }
    if (!isUUID(this._props.parentId)) {
      throw new DomainModelException(`Parent ID is not UUID`);
    }
  }
}
