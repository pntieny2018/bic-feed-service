import { UnprocessableEntityException } from '@nestjs/common';
import { StringHelper } from '../../../../../common/helpers';
import { AggregateRoot, EntityProps, IDomainEvent, CreatedAt, UpdatedAt } from '@beincom/domain';
import { GroupId } from '../group';
import { TagId, TagName, TagSlug, TagTotalUsed } from '.';
import { UserId } from '../user';
import { TagDeletedEvent } from '../../event/tag-deleted.event';
export type TagProps = {
  groupId: GroupId;
  name: TagName;
  createdBy: UserId;
  updatedBy: UserId;
  slug: TagSlug;
  totalUsed: TagTotalUsed;
};

export class TagEntity extends AggregateRoot<TagId, TagProps> {
  public static TAG_NAME_MAX_LENGTH = 32;

  protected _id: TagId;

  public constructor(
    entityProps: EntityProps<TagId, TagProps>,
    domainEvent: IDomainEvent<unknown>[] = []
  ) {
    super(entityProps, domainEvent, { disablePropSetter: false });
    this._id = entityProps.id;
  }

  public validate(): void {
    //
  }

  public static fromJson(raw: any): TagEntity {
    const props: EntityProps<TagId, TagProps> = {
      id: TagId.fromString(raw.id),
      props: {
        groupId: GroupId.fromString(raw.groupId),
        name: TagName.fromString(raw.name),
        slug: TagSlug.fromString(raw.slug),
        totalUsed: TagTotalUsed.fromString(raw.totalUsed),
        createdBy: UserId.fromString(raw.createdBy),
        updatedBy: UserId.fromString(raw.updatedBy),
      },
      createdAt: CreatedAt.fromDateString(raw.createdAt),
      updatedAt: UpdatedAt.fromDateString(raw.updatedAt),
    };

    return new TagEntity(props);
  }

  public update(properties: Partial<TagProps>): void {
    const { name, updatedBy } = properties;
    this._props.name = name;
    this._props.updatedBy = updatedBy;
    this._props.slug = new TagSlug({ value: StringHelper.convertToSlug(name.value) });
  }

  public delete(): void {
    if (this._props.totalUsed.value > 0) {
      throw new UnprocessableEntityException('i18n error');
    }
    this.raiseEvent(new TagDeletedEvent({ name: 'á fasdf' }));
  }
}
