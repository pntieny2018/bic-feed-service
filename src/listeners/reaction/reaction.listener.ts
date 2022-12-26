import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { CreateReactionInternalEvent, DeleteReactionInternalEvent } from '../../events/reaction';
import { ReactionEventPayload } from '../../events/reaction/payload';
import { NotificationService, TypeActivity } from '../../notification';
import { NotificationPayloadDto } from '../../notification/dto/requests/notification-payload.dto';
import { ReactionHasBeenCreated } from '../../common/constants';
import { FollowService } from '../../modules/follow';
import { ReactionActivityService } from '../../notification/activities';
import { FeedService } from '../../modules/feed/feed.service';
import { ArticleService } from '../../modules/article/article.service';
import { PostResponseDto } from '../../modules/post/dto/responses';
import { ReactionResponseDto } from '../../modules/reaction/dto/response';
import { UserSharedDto } from '../../shared/user/dto';
import { PostType } from '../../database/models/post.model';
import { CommentResponseDto } from '../../modules/comment/dto/response';
import { NIL as NIL_UUID } from 'uuid';

@Injectable()
export class ReactionListener {
  private readonly _logger = new Logger(ReactionListener.name);

  public constructor(
    private readonly _feedService: FeedService,
    private readonly _followService: FollowService,
    private readonly _articleService: ArticleService,
    private readonly _reactionActivityService: ReactionActivityService,
    private readonly _notificationService: NotificationService
  ) {}

  @On(CreateReactionInternalEvent)
  public onCreatedReactionEvent(event: CreateReactionInternalEvent): void {
    const { payload } = event;

    this._feedService.markSeenPosts(payload.post.id, payload.actor.id).catch((ex) => {
      this._logger.error(ex);
    });

    this._notifyPostReaction(payload).catch((ex) => this._logger.error(ex));

    this._notifyCommentReaction(payload);
  }

  @On(DeleteReactionInternalEvent)
  public onDeleteReactionEvent(event: DeleteReactionInternalEvent): void {
    const deleteReactionEventPayload: ReactionEventPayload = {
      reaction: event.payload.reaction,
      post: event.payload.post,
      comment: event.payload.comment,
    };
    const kafkaDeleteReactionMessage: NotificationPayloadDto<ReactionEventPayload> = {
      key: event.getEventName(),
      value: {
        actor: event.payload.userSharedDto,
        event: event.getEventName(),
        data: deleteReactionEventPayload,
      },
    };
    this._notificationService.publishReactionNotification<ReactionEventPayload>(
      kafkaDeleteReactionMessage
    );
  }

  private async _notifyPostReaction(data: {
    post: PostResponseDto;
    reaction: ReactionResponseDto;
    actor: UserSharedDto;
  }): Promise<void> {
    const { actor, reaction } = data;
    let post = data.post;

    if (post.isHidden) {
      return;
    }

    if (post.type === PostType.ARTICLE) {
      post = await this._articleService.get(post.id, actor, { withComment: false });
    }

    this._followService
      .getValidUserIds(
        [post.actor.id],
        post.audience.groups.map((g) => g.id)
      )
      .then((userIds) => {
        if (!userIds.length) {
          return;
        }
        const activity = this._reactionActivityService.createPayload(
          TypeActivity.POST,
          {
            reaction: reaction,
            post: post,
          },
          'create'
        );

        this._notificationService.publishReactionNotification({
          key: `${post.id}`,
          value: {
            actor: actor,
            event: ReactionHasBeenCreated,
            data: activity,
          },
        });
      })
      .catch((ex) => {
        this._logger.error(ex);
      });
  }

  private _notifyCommentReaction(data: {
    post: PostResponseDto;
    comment?: CommentResponseDto;
    reaction: ReactionResponseDto;
    actor: UserSharedDto;
  }): void {
    const { post, comment, reaction, actor } = data;
    if (!comment) {
      return;
    }
    if (post.isHidden) {
      return;
    }
    const type = comment.parentId !== NIL_UUID ? TypeActivity.CHILD_COMMENT : TypeActivity.COMMENT;
    const ownerId = comment.parentId !== NIL_UUID ? comment.parent.actor.id : comment.actor.id;

    this._followService
      .getValidUserIds(
        [ownerId],
        post.audience.groups.map((g) => g.id)
      )
      .then((userIds) => {
        if (!userIds.length) {
          return;
        }
        const activity = this._reactionActivityService.createPayload(
          type,
          {
            reaction: reaction,
            post: post,
            comment,
          },
          'create'
        );

        this._notificationService.publishReactionNotification({
          key: `${post.id}`,
          value: {
            actor: {
              id: actor.id,
              fullname: actor.fullname,
              username: actor.username,
              avatar: actor.avatar,
            },
            event: ReactionHasBeenCreated,
            data: activity,
          },
        });
      })
      .catch((ex) => {
        this._logger.error(ex);
      });
  }
}
