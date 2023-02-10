import { AggregateRoot, CreatedAt, EntityProps, IDomainEvent, UpdatedAt } from '@beincom/domain';
import { TagId, TagName, TagSlug, TagTotalUsed } from '.';
import { StringHelper } from '../../../../../common/helpers';
import { GroupId } from '../../../../v2-group/domain/model/group';
import { UserId } from '../../../../v2-user/domain/model/user';
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
}
