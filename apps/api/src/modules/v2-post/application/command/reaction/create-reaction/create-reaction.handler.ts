import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
} from '../../../../../v2-user/application';
import { REACTION_TARGET } from '../../../../data-type';
import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface/reaction.domain-service.interface';
import { ReactionDuplicateException } from '../../../../domain/exception';
import { ReactionEntity } from '../../../../domain/model/reaction';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';
import { ReactionDto } from '../../../dto';

import { CreateReactionCommand } from './create-reaction.command';

@CommandHandler(CreateReactionCommand)
export class CreateReactionHandler implements ICommandHandler<CreateReactionCommand, ReactionDto> {
  public constructor(
    @Inject(POST_REACTION_REPOSITORY_TOKEN)
    private readonly _postReactionRepository: IPostReactionRepository,
    @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
    private readonly _commentReactionRepository: ICommentReactionRepository,
    @Inject(REACTION_DOMAIN_SERVICE_TOKEN)
    private readonly _reactionDomainService: IReactionDomainService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userAppService: IUserApplicationService,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(command: CreateReactionCommand): Promise<ReactionDto> {
    const newCreateReactionDto = this.transformReactionNameNodeEmoji(command.payload);
    await this._validate(command);

    const newReactionEntity = await this._reactionDomainService.createReaction(
      newCreateReactionDto
    );

    const actor = await this._userAppService.findOne(newReactionEntity.get('createdBy'));

    return new ReactionDto({
      id: newReactionEntity.get('id'),
      target: newReactionEntity.get('target'),
      targetId: newReactionEntity.get('targetId'),
      reactionName: newReactionEntity.get('reactionName'),
      createdAt: newReactionEntity.get('createdAt'),
      actor,
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

  private async _validate(command: CreateReactionCommand): Promise<void> {
    let reactionEntity: ReactionEntity;
    const newCreateReactionDto = this.transformReactionNameNodeEmoji(command.payload);
    if (command.payload.target === REACTION_TARGET.COMMENT) {
      await this._commentDomainService.getVisibleComment(newCreateReactionDto.targetId);
      reactionEntity = await this._commentReactionRepository.findOne({
        commentId: newCreateReactionDto.targetId,
        createdBy: newCreateReactionDto.createdBy,
        reactionName: newCreateReactionDto.reactionName,
      });
    } else {
      await this._contentDomainService.getVisibleContent(newCreateReactionDto.targetId);
      reactionEntity = await this._postReactionRepository.findOne({
        postId: newCreateReactionDto.targetId,
        createdBy: newCreateReactionDto.createdBy,
        reactionName: newCreateReactionDto.reactionName,
      });
    }
    if (reactionEntity) {
      throw new ReactionDuplicateException();
    }
  }
}
