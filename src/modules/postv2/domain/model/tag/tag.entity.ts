import { UnprocessableEntityException } from '@nestjs/common';
import { StringHelper } from '../../../../../common/helpers';
import {
  UUID,
  AggregateRoot,
  CreatedAt,
  DeletedAt,
  Entity,
  EntityProps,
  UpdatedAt,
  IDomainEvent,
  EntitySetting,
} from '@beincom/domain';
export type TagProps = {
  id: UUID;
  groupId: UUID;
  name: string;
  createdBy: UUID;
  updatedBy: UUID;
  slug: string;
  totalUsed: number;
};

export class TagEntity extends AggregateRoot<UUID, TagProps> {
  public static TAG_NAME_MAX_LENGTH = 32;

  protected _id: UUID;

  public constructor(
    entityProps: EntityProps<UUID, TagProps>,
    domainEvent: IDomainEvent<unknown>[]
  ) {
    super(entityProps, domainEvent, { disablePropSetter: true });
    this._id = entityProps.id;
  }

  public validate(): void {
    if (!this._props.name) {
      throw new Error('Tag name is required');
    }
    if (this._props.totalUsed > 0) {
      throw new Error('i18n error');
    }
  }

  public increaseTotalUsed(): void {
    this._props.totalUsed += 1;
  }

  public update(properties: Partial<TagProps>): void {
    const { name, updatedBy } = properties;
    this._props.name = name;
    this._props.updatedBy = updatedBy;
    this._props.slug = StringHelper.convertToSlug(name);
  }

  public delete(): void {
    if (this._props.totalUsed > 0) {
      throw new UnprocessableEntityException('i18n error');
    }
  }
}
