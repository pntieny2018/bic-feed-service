import { StringHelper } from '@libs/common/helpers';
import { v4, validate as isUUID } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { DomainModelException } from '../../../../../common/exceptions';
import { RULES } from '../../../constant';

export type TagAttributes = {
  id: string;
  groupId: string;
  name: string;
  createdBy?: string;
  updatedBy?: string;
  slug?: string;
  totalUsed?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export class TagEntity extends DomainAggregateRoot<TagAttributes> {
  public constructor(props: TagAttributes) {
    super(props);
  }

  public static create(options: Partial<TagAttributes>, userId: string): TagEntity {
    const { name, groupId } = options;
    const now = new Date();
    return new TagEntity({
      id: v4(),
      groupId: groupId,
      name: name,
      slug: StringHelper.convertToSlug(name),
      totalUsed: 0,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    });
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

  public update(props: Partial<TagAttributes>): void {
    const { name, updatedBy } = props;
    this._props.name = name.toUpperCase();
    this._props.updatedBy = updatedBy;
    this._props.slug = StringHelper.convertToSlug(name);
  }

  public decreaseTotalUsed(): void {
    this._props.totalUsed -= 1;
  }

  public increaseTotalUsed(): void {
    this._props.totalUsed += 1;
  }
}
