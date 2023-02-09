import { AggregateRoot, CreatedAt, EntityProps, IDomainEvent, UpdatedAt } from '@beincom/domain';
import { GroupId } from '.';
import { GROUP_PRIVACY } from '../../../data-type';
import { CommunityId } from '../community';
import { GroupIcon } from './group-icon.value-object';
import { GroupName } from './group-name.value-object';
import { GroupPrivacy } from './group-privacy.value-object';

export type GroupProps = {
  name: GroupName;
  icon: GroupIcon;
  privacy: GroupPrivacy;
  communityId: CommunityId;
  rootGroupId: GroupId;
  isCommunity: boolean;
  child: {
    open: GroupId[];
    closed: GroupId[];
    private: GroupId[];
    secret: GroupId[];
  };
};

export class GroupEntity extends AggregateRoot<GroupId, GroupProps> {
  protected _id: GroupId;

  public constructor(
    entityProps: EntityProps<GroupId, GroupProps>,
    domainEvent: IDomainEvent<unknown>[] = []
  ) {
    super(entityProps, domainEvent, { disablePropSetter: false });
    this._id = entityProps.id;
  }

  public validate(): void {
    //
  }

  public static fromJson(raw: any): GroupEntity {
    const props: EntityProps<GroupId, GroupProps> = {
      id: GroupId.fromString(raw.id),
      props: {
        name: GroupName.fromString(raw.name),
        icon: GroupIcon.fromString(raw.icon),
        privacy: GroupPrivacy.fromString(raw.privacy),
        communityId: CommunityId.fromString(raw.communityId),
        rootGroupId: GroupId.fromString(raw.rootGroupId),
        isCommunity: raw.isCommunity,
        child: {
          open: raw.child.open.map((id) => GroupId.fromString(id)),
          closed: raw.child.closed.map((id) => GroupId.fromString(id)),
          private: raw.child.private.map((id) => GroupId.fromString(id)),
          secret: raw.child.secret.map((id) => GroupId.fromString(id)),
        },
      },
      //Todo: remove it, currently we dont have this on redis.
      createdAt: CreatedAt.fromDateString(new Date().toISOString()),
      updatedAt: UpdatedAt.fromDateString(new Date().toISOString()),
    };

    return new GroupEntity(props);
  }

  public isCommunity(): boolean {
    return this._props.isCommunity;
  }

  public isOpenGroup(): boolean {
    return this._props.privacy.value === GROUP_PRIVACY.OPEN;
  }

  public isPrivateGroup(): boolean {
    return this._props.privacy.value === GROUP_PRIVACY.PRIVATE;
  }

  public isSecretGroup(): boolean {
    return this._props.privacy.value === GROUP_PRIVACY.SECRET;
  }

  public isClosedGroup(): boolean {
    return this._props.privacy.value === GROUP_PRIVACY.CLOSED;
  }
}
