import { StringHelper } from '../../../../../common/helpers';
import { RULES } from '../../../constant';
import { AggregateRoot } from '@nestjs/cqrs';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

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

export class TagEntity extends AggregateRoot {
  private _props: TagProps;

  public constructor(props: TagProps) {
    super();
    this.validate(props);
    this._props = { ...props };
  }

  public validate(props: Partial<TagProps>): void {
    if (props.name.length > RULES.TAG_MAX_NAME) {
      throw new DomainModelException(`Tag name must not exceed ${RULES.TAG_MAX_NAME} characters`);
    }
    if (props.totalUsed < 0) {
      throw new DomainModelException(`Total used must be >= 0`);
    }
  }

  public update(props: Partial<TagProps>): void {
    this.validate(props);
    const { name, updatedBy } = props;
    this._props.name = name;
    this._props.updatedBy = updatedBy;
    this._props.slug = StringHelper.convertToSlug(name);
  }
}
