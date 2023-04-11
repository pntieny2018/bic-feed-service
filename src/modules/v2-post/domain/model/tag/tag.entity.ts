import { StringHelper } from '../../../../../common/helpers';
import { RULES } from '../../../constant';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';

export type TagProps = {
  id: string;
  groupId: string;
  name: string;
  createdBy: string;
  updatedBy: string;
  slug: string;
  totalUsed: number;
  createdAt: Date;
  updatedAt: Date;
};

export class TagEntity extends DomainAggregateRoot<TagProps> {
  public constructor(props: TagProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.groupId)) {
      throw new DomainModelException(`Group ID is not UUID`);
    }
    if (!isUUID(this._props.createdBy)) {
      throw new DomainModelException(`Created By is not UUID`);
    }
    if (!isUUID(this._props.updatedBy)) {
      throw new DomainModelException(`Updated By is not UUID`);
    }
    if (!this._props.name) {
      throw new DomainModelException(`Tag name is required`);
    }
    if (this._props.name.length > RULES.TAG_MAX_NAME) {
      throw new DomainModelException(`Tag name must not exceed ${RULES.TAG_MAX_NAME} characters`);
    }
    if (this._props.totalUsed < 0) {
      throw new DomainModelException(`Total used must be >= 0`);
    }
  }

  public update(props: Partial<TagProps>): void {
    const { name, updatedBy } = props;
    this._props.name = name.toUpperCase();
    this._props.updatedBy = updatedBy;
    this._props.slug = StringHelper.convertToSlug(name);
  }
}
