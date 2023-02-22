import { TagSlug } from '.';
import { StringHelper } from '../../../../../common/helpers';
import { RULES } from '../../../constant';
import { AggregateRoot } from '@nestjs/cqrs';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

export type TagProps = {
  groupId: string;
  name: string;
  createdBy: string;
  updatedBy: string;
  slug: string;
  totalUsed: number;
};

export class TagEntity extends AggregateRoot {
  private _props: TagProps;

  public constructor() {
    super();
  }

  public validate(): void {
    if (this._props.name.length > RULES.TAG_MAX_NAME) {
      throw new DomainModelException(`Tag name must not exceed ${RULES.TAG_MAX_NAME} characters`);
    }
  }

  public update(properties: Partial<TagProps>): void {
    const { name, updatedBy } = properties;
    this._props.name = name;
    this._props.updatedBy = updatedBy;
    this._props.slug = new TagSlug({ value: StringHelper.convertToSlug(name.value) });
  }
}
