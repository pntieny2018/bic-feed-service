import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/reaction.domain-service.interface';

import { DeleteReactionCommand } from './delete-reaction.command';

@CommandHandler(DeleteReactionCommand)
export class DeleteReactionHandler implements ICommandHandler<DeleteReactionCommand, void> {
  public constructor(
    @Inject(REACTION_DOMAIN_SERVICE_TOKEN)
    private readonly _reactionDomainService: IReactionDomainService
  ) {}

  public async execute(command: DeleteReactionCommand): Promise<void> {
    return this._reactionDomainService.deleteReaction(command.payload);
  }
}
