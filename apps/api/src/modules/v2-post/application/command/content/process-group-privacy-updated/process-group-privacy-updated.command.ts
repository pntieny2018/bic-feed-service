import { PRIVACY } from '@beincom/constants';
import { ICommand } from '@nestjs/cqrs';

export type ProcessGroupPrivacyUpdatedCommandPayload = {
  groupId: string;
  privacy: PRIVACY;
};

export class ProcessGroupPrivacyUpdatedCommand implements ICommand {
  public constructor(public readonly payload: ProcessGroupPrivacyUpdatedCommandPayload) {}
}
