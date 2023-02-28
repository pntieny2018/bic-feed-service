import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateReactionCommand } from './create-reaction.command';
import { CreateReactionDto } from './create-reaction.dto';
import {
  IReactionRepository,
  REACTION_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/reaction.repository.interface';
import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/reaction.domain-service.interface';
import { ReactionEnum } from '../../../../reaction/reaction.enum';
import { LogicException } from '../../../../../common/exceptions';
import { HTTP_STATUS_ID } from '../../../../../common/constants';

@CommandHandler(CreateReactionCommand)
export class CreateReactionHandler
  implements ICommandHandler<CreateReactionCommand, CreateReactionDto>
{
  @Inject(REACTION_REPOSITORY_TOKEN)
  private readonly _reactionRepository: IReactionRepository;
  @Inject(REACTION_DOMAIN_SERVICE_TOKEN)
  private readonly _reactionDomainService: IReactionDomainService;

  public async execute(command: CreateReactionCommand): Promise<CreateReactionDto> {
    const newCreateReactionDto = CreateReactionHandler.transformReactionNameNodeEmoji(
      command.payload
    );

    switch (newCreateReactionDto.target) {
      case ReactionEnum.POST:
      case ReactionEnum.ARTICLE:
        return this._createPostReaction(userDto, newCreateReactionDto);
      case ReactionEnum.COMMENT:
        return this._createCommentReaction(userDto, newCreateReactionDto);
      default:
        throw new LogicException(HTTP_STATUS_ID.APP_REACTION_TARGET_EXISTING);
    }
  }

  public static transformReactionNameNodeEmoji<T>(doActionReactionDto: T): T {
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
