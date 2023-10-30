import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { v4 } from 'uuid';

import {
  KAFKA_TOPIC,
  ReactionHasBeenCreated,
  ReactionHasBeenRemoved,
} from '../../../../../common/constants';
import { TypeActivity, VerbActivity } from '../../../../../notification';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../../v2-user/application';
import { REACTION_TARGET } from '../../../data-type';
import { ReactionNotifyEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';
import { CommentEntity } from '../../../domain/model/comment';
import { ArticleEntity, ContentEntity, PostEntity } from '../../../domain/model/content';
import { ReactionEntity } from '../../../domain/model/reaction';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentReactionRepository,
  ICommentRepository,
  IContentRepository,
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import { IReactionBinding, REACTION_BINDING_TOKEN } from '../../binding';
import { IMediaBinding, MEDIA_BINDING_TOKEN } from '../../binding/binding-media';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../binding/binding-post/content.interface';
import { ReactionDto } from '../../dto';

@EventsHandler(ReactionNotifyEvent)
export class ReactionNotifyEventHandler implements IEventHandler<ReactionNotifyEvent> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(REACTION_BINDING_TOKEN)
    private readonly _reactionBinding: IReactionBinding,
    @Inject(MEDIA_BINDING_TOKEN)
    private readonly _mediaBinding: IMediaBinding,

    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepo: ICommentRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
    private readonly _commentReactionRepo: ICommentReactionRepository,
    @Inject(POST_REACTION_REPOSITORY_TOKEN)
    private readonly _postReactionRepo: IPostReactionRepository,

    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter,

    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userAppService: IUserApplicationService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService
  ) {}

  public async handle(event: ReactionNotifyEvent): Promise<void> {
    const { reactionEntity, action } = event;

    const actor = await this._userAppService.findOne(reactionEntity.get('createdBy'));

    if (reactionEntity.get('target') === REACTION_TARGET.COMMENT) {
      await this._sendReactCommentNotification(
        reactionEntity,
        reactionEntity.get('targetId'),
        action,
        actor
      );
    }

    if (
      reactionEntity.get('target') === REACTION_TARGET.POST ||
      reactionEntity.get('target') === REACTION_TARGET.ARTICLE
    ) {
      await this._sendReactContentNotification(
        reactionEntity,
        reactionEntity.get('targetId'),
        action,
        actor
      );
    }
  }

  private async _sendReactCommentNotification(
    reactionEntity: ReactionEntity,
    commentId: string,
    action: 'create' | 'delete',
    actor: UserDto
  ): Promise<void> {
    const commentEntity = await this._commentRepo.findOne(
      { id: commentId },
      {
        includeOwnerReactions: actor.id,
      }
    );
    if (!commentEntity) {
      return;
    }

    const contentEntity = (await this._contentRepo.findOne({
      where: { id: commentEntity.get('postId') },
      include: {
        mustIncludeGroup: true,
      },
    })) as ContentEntity;
    if (!contentEntity) {
      return;
    }

    const userIds = [contentEntity.get('createdBy')];
    if (contentEntity instanceof PostEntity) {
      userIds.push(...contentEntity.get('mentionUserIds'));
    }
    const users = await this._userAppService.findAllByIds(userIds);
    let mentionUsers = {};

    if (
      contentEntity instanceof PostEntity &&
      contentEntity.get('mentionUserIds') &&
      users.length
    ) {
      mentionUsers = this._contentBinding.mapMentionWithUserInfo(
        users.filter((user) => contentEntity.get('mentionUserIds').includes(user.id))
      );
    }

    const contentActor = users.find((user) => user.id === contentEntity.get('createdBy'));

    const groups = await this._groupAppService.findAllByIds(contentEntity.get('groupIds'));
    const activity = {
      id: contentEntity.getId(),
      actor: contentActor,
      audience: {
        groups,
      },
      title:
        contentEntity instanceof ArticleEntity || contentEntity instanceof PostEntity
          ? contentEntity.getTitle()
          : null,
      contentType: contentEntity.get('type'),
      content: contentEntity instanceof PostEntity ? contentEntity.get('content') : null,
      mentions: mentionUsers,
      setting: contentEntity.get('setting'),
      media: this._mediaBinding.binding(contentEntity.get('media')),
      comment: await this._getCommentPayload(reactionEntity, commentEntity),
      createdAt: contentEntity.get('createdAt'),
      updatedAt: contentEntity.get('updatedAt'),
    };
    this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.REACTION, {
      key: contentEntity.getId(),
      value: {
        actor: actor,
        event: action === 'create' ? ReactionHasBeenCreated : ReactionHasBeenRemoved,
        data: {
          id: v4(),
          object: activity,
          verb: VerbActivity.REACT,
          target: commentEntity.isChildComment()
            ? TypeActivity.CHILD_COMMENT
            : TypeActivity.COMMENT,
          ignore: [],
          createdAt: reactionEntity.get('createdAt'),
          updatedAt: reactionEntity.get('createdAt'),
        },
      },
    });
  }

  private async _getCommentPayload(
    reactionEntity: ReactionEntity,
    commentEntity: CommentEntity
  ): Promise<any> {
    const userIds = [commentEntity.get('createdBy')];
    if (commentEntity.get('mentions')?.length) {
      userIds.push(...commentEntity.get('mentions'));
    }
    const users = await this._userAppService.findAllByIds(userIds);

    let mentionUsersComment = {};
    const commentActor = users.find((user) => user.id === commentEntity.get('createdBy'));
    const reactionsCount = await this._commentReactionRepo.getAndCountReactionByComments([
      commentEntity.get('id'),
    ]);
    if (commentEntity.get('mentions') && users.length) {
      mentionUsersComment = this._contentBinding.mapMentionWithUserInfo(
        users.filter((user) => commentEntity.get('mentions').includes(user.id))
      );
    }

    const reaction = await this._reactionBinding.binding(reactionEntity);

    let comment: any;

    let parentCommentEntity: CommentEntity = null;
    if (commentEntity.isChildComment()) {
      parentCommentEntity = await this._commentRepo.findOne({
        id: commentEntity.get('parentId'),
      });
      const userIdsOfParent = [parentCommentEntity.get('createdBy')];
      if (parentCommentEntity.get('mentions')?.length) {
        userIdsOfParent.push(...parentCommentEntity.get('mentions'));
      }
      const usersOfParent = await this._userAppService.findAllByIds(userIdsOfParent);
      comment = {
        id: parentCommentEntity.get('id'),
        actor: usersOfParent.find((user) => user.id === parentCommentEntity.get('createdBy')),
        content: parentCommentEntity.get('content'),
        media: this._mediaBinding.binding(parentCommentEntity.get('media')),
        mentions: this._contentBinding.mapMentionWithUserInfo(
          usersOfParent.filter((user) => parentCommentEntity.get('mentions').includes(user.id))
        ),
        child: {
          id: commentEntity.get('id'),
          actor: commentActor,
          reaction,
          content: commentEntity.get('content'),
          media: this._mediaBinding.binding(commentEntity.get('media')),
          mentions: mentionUsersComment,
          reactionsCount: reactionsCount.get(commentEntity.get('id')) || [],
          reactionsOfActor: commentEntity.get('ownerReactions').map(
            (item) =>
              new ReactionDto({
                id: item.get('id'),
                reactionName: item.get('reactionName'),
                createdAt: item.get('createdAt'),
              })
          ),
          createdAt: commentEntity.get('createdAt'),
          updatedAt: commentEntity.get('updatedAt'),
        },
        createdAt: parentCommentEntity.get('createdAt'),
        updatedAt: parentCommentEntity.get('updatedAt'),
      };
    } else {
      comment = {
        id: commentEntity.get('id'),
        actor: commentActor,
        reaction,
        content: commentEntity.get('content'),
        media: this._mediaBinding.binding(commentEntity.get('media')),
        mentions: mentionUsersComment,
        reactionsCount: reactionsCount.get(commentEntity.get('id')) || [],
        reactionsOfActor: commentEntity.get('ownerReactions').map(
          (item) =>
            new ReactionDto({
              id: item.get('id'),
              reactionName: item.get('reactionName'),
              createdAt: item.get('createdAt'),
            })
        ),
        createdAt: commentEntity.get('createdAt'),
        updatedAt: commentEntity.get('updatedAt'),
      };
    }

    return comment;
  }

  private async _sendReactContentNotification(
    reactionEntity: ReactionEntity,
    contentId: string,
    action: 'create' | 'delete',
    actor: UserDto
  ): Promise<void> {
    const contentEntity = (await this._contentRepo.findOne({
      where: { id: contentId },
      include: {
        mustIncludeGroup: true,
        shouldIncludeReaction: {
          userId: actor.id,
        },
      },
    })) as ContentEntity;
    if (!contentEntity || contentEntity.isHidden()) {
      return;
    }

    const userIds = [contentEntity.get('createdBy')];
    if (contentEntity instanceof PostEntity) {
      userIds.push(...contentEntity.get('mentionUserIds'));
    }
    const users = await this._userAppService.findAllByIds(userIds);
    let mentionUsers = {};
    if (
      contentEntity instanceof PostEntity &&
      contentEntity.get('mentionUserIds') &&
      users.length
    ) {
      mentionUsers = this._contentBinding.mapMentionWithUserInfo(
        users.filter((user) => contentEntity.get('mentionUserIds').includes(user.id))
      );
    }

    const contentActor = users.find((user) => user.id === contentEntity.get('createdBy'));
    const reactionsCount = await this._postReactionRepo.getAndCountReactionByContents([
      contentEntity.get('id'),
    ]);
    const groups = await this._groupAppService.findAllByIds(contentEntity.get('groupIds'));

    const reaction = await this._reactionBinding.binding(reactionEntity);

    const activity = {
      id: contentEntity.getId(),
      actor: contentActor,
      audience: {
        groups,
      },
      title:
        contentEntity instanceof ArticleEntity || contentEntity instanceof PostEntity
          ? contentEntity.getTitle()
          : null,
      contentType: contentEntity.getType(),
      content: contentEntity instanceof PostEntity ? contentEntity.get('content') : null,
      media:
        contentEntity instanceof PostEntity
          ? this._mediaBinding.binding(contentEntity.get('media'))
          : { files: [], images: [], videos: [] },
      mentions: mentionUsers,
      setting: contentEntity.get('setting'),
      reaction,
      reactionsOfActor: contentEntity.get('ownerReactions'),
      reactionsCount: reactionsCount.get(contentEntity.getId()) || [],
      createdAt: contentEntity.get('createdAt'),
      updatedAt: contentEntity.get('updatedAt'),
    };
    this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.REACTION, {
      key: contentEntity.getId(),
      value: {
        actor: actor,
        event: action === 'create' ? ReactionHasBeenCreated : ReactionHasBeenRemoved,
        data: {
          id: v4(),
          object: activity,
          verb: VerbActivity.REACT,
          target: TypeActivity.POST,
          ignore: [],
          createdAt: reaction.createdAt,
          updatedAt: reaction.createdAt,
        },
      },
    });
  }
}
