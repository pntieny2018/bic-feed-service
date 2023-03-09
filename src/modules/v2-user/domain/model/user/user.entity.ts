import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

export type UserPermission = {
  communities: Record<string, string[]>;
  groups: Record<string, string[]>;
};

export type UserProps = {
  id: string;
  username: string;
  fullname: string;
  avatar: string;
  email: string;
  groups: string[];
  permissions?: UserPermission;
};

export class UserEntity extends DomainAggregateRoot<UserProps> {
  public constructor(props: UserProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`User ID is not UUID`);
    }
    if (!this._props.username) {
      throw new DomainModelException(`username is required`);
    }
  }

  public setPermissions(permissions: UserPermission): void {
    this._props.permissions = permissions;
  }
}
