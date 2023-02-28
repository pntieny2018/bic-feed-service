import { Inject, Logger } from '@nestjs/common';
import { ReactionEntity } from '../model/reaction';
import { IReactionRepository, REACTION_REPOSITORY_TOKEN } from '../repositoty-interface';
import {
  IReactionDomainService,
  ReactionCreateProps,
  ReactionUpdateProps,
} from './interface/reaction.domain-service.interface';
import { IReactionFactory, REACTION_FACTORY_TOKEN } from '../factory';

export class ReactionDomainService implements IReactionDomainService {
  private readonly _logger = new Logger(ReactionDomainService.name);

  @Inject(REACTION_REPOSITORY_TOKEN)
  private readonly _reactionRepository: IReactionRepository;
  @Inject(REACTION_FACTORY_TOKEN)
  private readonly _reactionFactory: IReactionFactory;

  public async createReaction(input: ReactionCreateProps): Promise<ReactionEntity> {
  }

  public async updateReaction(reaction: ReactionEntity, input: ReactionUpdateProps): Promise<ReactionEntity> {
  }

  public async deleteReaction(reactionId: string): Promise<void> {
  }
}
