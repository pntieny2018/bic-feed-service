import { PRIVACY } from '@beincom/constants';

import { GROUP_STATE_VERB } from '../../../data-type';

export class GroupPrivacyUpdatedMessagePayload {
  public groupId: string;
  public privacy: PRIVACY;

  public constructor(data: Partial<GroupPrivacyUpdatedMessagePayload>) {
    Object.assign(this, data);
  }
}

export class GroupStateUpdatedMessagePayload {
  public data: {
    object: { groups: { id: string }[] };
    verb: GROUP_STATE_VERB;
  };
}
