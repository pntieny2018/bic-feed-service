import { GroupPrivacy } from '../../../data-type';
import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';

export type GroupProps = {
  id: string;
  name: string;
  icon: string;
  privacy: GroupPrivacy;
  communityId: string;
  rootGroupId: string;
  isCommunity: boolean;
  child: {
    open: string[];
    closed: string[];
    private: string[];
    secret: string[];
  };
};

export class GroupEntity extends DomainAggregateRoot<GroupProps> {
  public constructor(props: GroupProps) {
    super(props);
  }

  public validate(): void {
    if (!isUUID(this._props.id)) {
      throw new DomainModelException(`Group ID must be UUID`);
    }
    if (!isUUID(this._props.communityId)) {
      throw new DomainModelException(`Community ID By must be UUID`);
    }
    if (!isUUID(this._props.rootGroupId)) {
      throw new DomainModelException(`Root group ID By must be UUID`);
    }
    if (!this._props.name) {
      throw new DomainModelException(`Group name is required`);
    }
  }

  public isCommunity(): boolean {
    return this._props.isCommunity;
  }

  public isOpenGroup(): boolean {
    return this._props.privacy === GroupPrivacy.OPEN;
  }

  public isPrivateGroup(): boolean {
    return this._props.privacy === GroupPrivacy.PRIVATE;
  }

  public isSecretGroup(): boolean {
    return this._props.privacy === GroupPrivacy.SECRET;
  }

  public isClosedGroup(): boolean {
    return this._props.privacy === GroupPrivacy.CLOSED;
  }
}
