import { ICommand } from '@nestjs/cqrs';

import { GROUP_STATE_VERB } from '../../../../data-type';

export type ProcessGroupStateUpdatedCommandPayload = {
  groupIds: string[];
  verb: GROUP_STATE_VERB;
};

export class ProcessGroupStateUpdatedCommand implements ICommand {
  public constructor(public readonly payload: ProcessGroupStateUpdatedCommandPayload) {}
}
