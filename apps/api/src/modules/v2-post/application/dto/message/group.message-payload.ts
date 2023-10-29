import { PRIVACY } from '@beincom/constants';

export class GroupPrivacyUpdatedMessagePayload {
  public groupId: string;
  public privacy: PRIVACY;

  public constructor(data: Partial<GroupPrivacyUpdatedMessagePayload>) {
    Object.assign(this, data);
  }
}
