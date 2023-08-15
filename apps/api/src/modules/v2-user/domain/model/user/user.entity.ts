import { validate as isUUID } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

export type UserPermission = {
  communities: Record<string, string[]>;
  groups: Record<string, string[]>;
};

export type BadgeCommunity = {
  id: string;
  name: string;
};

export type UserBadge = {
  id: string;
  name: string;
  iconUrl: string;
  community: BadgeCommunity;
};

export type UserProps = {
  id: string;
  username: string;
  fullname: string;
  avatar: string;
  email: string;
  groups: string[];
  permissions?: UserPermission;
  isDeactivated?: boolean;
  isVerified?: boolean;
  showingBadges?: UserBadge[];
};

export class UserEntity extends DomainAggregateRoot<UserProps> {
  public constructor(props: UserProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`User ID must be UUID`);
    }
    if (!this._props.username) {
      throw new DomainModelException(`username is required`);
    }
  }

  public setPermissions(permissions: UserPermission): void {
    this._props.permissions = permissions;
  }
}
