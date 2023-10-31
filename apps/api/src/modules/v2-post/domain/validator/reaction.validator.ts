import { CONTENT_TARGET } from '@beincom/constants';
import { Inject, Injectable } from '@nestjs/common';

import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IContentDomainService,
} from '../domain-service/interface';
import { ReactionDuplicateException } from '../exception';
import { ReactionEntity } from '../model/reaction';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../repositoty-interface';

import {
  CONTENT_VALIDATOR_TOKEN,
  CreateReactionValidatorPayload,
  IContentValidator,
  IReactionValidator,
} from './interface';

@Injectable()
export class ReactionValidator implements IReactionValidator {
  public constructor(
    @Inject(POST_REACTION_REPOSITORY_TOKEN)
    private readonly _postReactionRepository: IPostReactionRepository,
    @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
    private readonly _commentReactionRepository: ICommentReactionRepository,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator
  ) {}

  public async validateCreateReaction(props: CreateReactionValidatorPayload): Promise<void> {
    let reactionEntity: ReactionEntity;

    if (props.target === CONTENT_TARGET.COMMENT) {
      const comment = await this._commentDomainService.getVisibleComment(props.targetId);
      const content = await this._contentDomainService.getVisibleContent(comment.get('postId'));
      await this._contentValidator.checkCanReadContent(content, props.authUser);

      reactionEntity = await this._commentReactionRepository.findOne({
        commentId: props.targetId,
        createdBy: props.authUser.id,
        reactionName: props.reactionName,
      });
    } else {
      const content = await this._contentDomainService.getVisibleContent(props.targetId);
      await this._contentValidator.checkCanReadContent(content, props.authUser);

      reactionEntity = await this._postReactionRepository.findOne({
        postId: props.targetId,
        createdBy: props.authUser.id,
        reactionName: props.reactionName,
      });
    }
    if (reactionEntity) {
      throw new ReactionDuplicateException();
    }
  }
}
