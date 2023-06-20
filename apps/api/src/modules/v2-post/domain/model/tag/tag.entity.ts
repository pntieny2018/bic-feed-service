import { StringHelper } from '../../../../../common/helpers';
import { RULES } from '../../../constant';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';

export type TagProps = {
  id: string;
  groupId: string;
  name: string;
  createdBy?: string;
  updatedBy?: string;
  slug: string;
  totalUsed?: number;
  createdAt: Date;
  updatedAt: Date;
};

export class TagEntity extends DomainAggregateRoot<TagProps> {
  public constructor(props: TagProps) {
    super(props);
  }

  public validate(): void {
    if (this._props.groupId && !isUUID(this._props.groupId)) {
      throw new DomainModelException(`Group ID must be UUID`);
    }
    if (this._props.createdBy && !isUUID(this._props.createdBy)) {
      throw new DomainModelException(`Created By must be UUID`);
    }
    if (this._props.updatedBy && !isUUID(this._props.updatedBy)) {
      throw new DomainModelException(`Updated By must be UUID`);
    }
    if (!this._props.name) {
      throw new DomainModelException(`Tag name is required`);
    }
    if (this._props.name.length > RULES.TAG_MAX_NAME) {
      throw new DomainModelException(`Tag name must not exceed ${RULES.TAG_MAX_NAME} characters`);
    }
  }

  public update(props: Partial<TagProps>): void {
    const { name, updatedBy } = props;
    this._props.name = name.toUpperCase();
    this._props.updatedBy = updatedBy;
    this._props.slug = StringHelper.convertToSlug(name);
  }

  public decreaseTotalUsed(): void {
    this._props.totalUsed -= 1;
  }
}
