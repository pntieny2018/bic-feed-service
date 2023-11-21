import { CONTENT_TARGET } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { instanceToInstance } from 'class-transformer';

import { TRANSFORMER_VISIBLE_ONLY } from '../../../../../common/constants';
import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import { ReactionCreatedEvent } from '../../../domain/event';
import { IWebsocketAdapter, WEBSOCKET_ADAPTER } from '../../../domain/service-adapter-interface';
import { IReactionBinding, REACTION_BINDING_TOKEN } from '../../binding';

@EventsHandler(ReactionCreatedEvent)
export class WsReactionCreatedEventHandler implements IEventHandler<ReactionCreatedEvent> {
  public constructor(
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    protected readonly _contentDomainService: IContentDomainService,
    @Inject(REACTION_BINDING_TOKEN)
    private readonly _reactionBinding: IReactionBinding,
    @Inject(WEBSOCKET_ADAPTER)
    private readonly _websocketAdapter: IWebsocketAdapter
  ) {}

  public async handle(event: ReactionCreatedEvent): Promise<void> {
    const { reactionEntity } = event;

    const targetId = reactionEntity.get('targetId');
    const reactionBinding = await this._reactionBinding.binding(reactionEntity);
    const reaction = instanceToInstance(reactionBinding, {
      groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC],
    });

    switch (reactionEntity.get('target')) {
      case CONTENT_TARGET.POST:
        const post = await this._contentDomainService.getVisibleContent(targetId);
        await this._websocketAdapter.emitReactionToPostEvent({
          event: ReactionCreatedEvent.event,
          recipients: post.getGroupIds(),
          reaction,
          contentType: post.get('type'),
          contentId: post.get('id'),
        });
        break;
      case CONTENT_TARGET.ARTICLE:
        const article = await this._contentDomainService.getVisibleContent(targetId);
        await this._websocketAdapter.emitReactionToArticleEvent({
          event: ReactionCreatedEvent.event,
          recipients: article.getGroupIds(),
          reaction,
          contentType: article.get('type'),
          contentId: article.get('id'),
        });
        break;
      case CONTENT_TARGET.COMMENT:
        const comment = await this._commentDomainService.getVisibleComment(targetId);
        const content = await this._contentDomainService.getVisibleContent(comment.get('postId'));
        await this._websocketAdapter.emitReactionToCommentEvent({
          event: ReactionCreatedEvent.event,
          recipients: content.getGroupIds(),
          reaction,
          commentId: comment.get('id'),
          parentId: comment.get('parentId'),
          contentType: content.get('type'),
          contentId: content.get('id'),
        });
        break;
      default:
        break;
    }
  }
}
