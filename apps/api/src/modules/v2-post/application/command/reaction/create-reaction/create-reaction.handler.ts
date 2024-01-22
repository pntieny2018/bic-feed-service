import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import {
  IReactionValidator,
  REACTION_VALIDATOR_TOKEN,
} from '../../../../domain/validator/interface';
import { ReactionDto } from '../../../dto';

import { CreateReactionCommand } from './create-reaction.command';

@CommandHandler(CreateReactionCommand)
export class CreateReactionHandler implements ICommandHandler<CreateReactionCommand, ReactionDto> {
  public constructor(
    @Inject(REACTION_DOMAIN_SERVICE_TOKEN)
    private readonly _reactionDomainService: IReactionDomainService,
    @Inject(REACTION_VALIDATOR_TOKEN)
    private readonly _reactionValidator: IReactionValidator
  ) {}

  public async execute(command: CreateReactionCommand): Promise<ReactionDto> {
    const newCreateReactionDto = this.transformReactionNameNodeEmoji(command.payload);
    await this._reactionValidator.validateCreateReaction(command.payload);

    const newReactionEntity = await this._reactionDomainService.createReaction(
      newCreateReactionDto
    );

    return new ReactionDto({
      id: newReactionEntity.get('id'),
      target: newReactionEntity.get('target'),
      targetId: newReactionEntity.get('targetId'),
      reactionName: newReactionEntity.get('reactionName'),
      createdAt: newReactionEntity.get('createdAt'),
      actor: command.payload.authUser,
    });
  }

  private transformReactionNameNodeEmoji<T>(doActionReactionDto: T): T {
    const copy = { ...doActionReactionDto };
    if (copy['reactionName'] === '+1') {
      copy['reactionName'] = 'thumbsup';
    }
    if (copy['reactionName'] === '-1') {
      copy['reactionName'] = 'thumbsdown';
    }
    return copy;
  }
}
