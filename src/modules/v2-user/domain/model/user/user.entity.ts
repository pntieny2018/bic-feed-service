import { AggregateRoot, CreatedAt, EntityProps, IDomainEvent, UpdatedAt } from '@beincom/domain';
import { UserAvatar, UserEmail, UserFullName, UserId, UserName } from '.';
import { GroupId } from '../../../../v2-group/domain/model/group';

export type UserProps = {
  username: UserName;
  fullname: UserFullName;
  avatar: UserAvatar;
  email: UserEmail;
  groups: GroupId[];
};

export class UserEntity extends AggregateRoot<UserId, UserProps> {
  protected _id: UserId;

  public constructor(
    entityProps: EntityProps<UserId, UserProps>,
    domainEvent: IDomainEvent<unknown>[] = []
  ) {
    super(entityProps, domainEvent, { disablePropSetter: false });
    this._id = entityProps.id;
  }

  public validate(): void {
    //
  }

  public static fromJson(raw: any): UserEntity {
    const props: EntityProps<UserId, UserProps> = {
      id: UserId.fromString(raw.id),
      props: {
        username: UserName.fromString(raw.username),
        fullname: UserFullName.fromString(raw.fullname),
        email: UserEmail.fromString(raw.email),
        avatar: UserAvatar.fromString(raw.avatar),
        groups: raw.groups.map((id) => GroupId.fromString(id)),
      },
      //Todo: remove it, currently we dont have this on redis.
      createdAt: CreatedAt.fromDateString(new Date().toISOString()),
      updatedAt: UpdatedAt.fromDateString(new Date().toISOString()),
    };

    return new UserEntity(props);
  }
}
