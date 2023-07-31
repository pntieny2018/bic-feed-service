import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProcessReactionNotificationCommand } from './process-reaction-notification.command';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { REACTION_TARGET } from '../../../data-type/reaction-target.enum';
import { FileDto, ImageDto, ReactionDto, VideoDto } from '../../dto';
import { KafkaService } from '@app/kafka';
import { KAFKA_TOPIC } from '@app/kafka/kafka.constant';
import { ReactionHasBeenCreated, ReactionHasBeenRemoved } from '../../../../../common/constants';
import { CommentEntity } from '../../../domain/model/comment';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
} from '../../../domain/repositoty-interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { ContentEntity } from '../../../domain/model/content/content.entity';
import { PostEntity } from '../../../domain/model/content';
import { ArticleEntity } from '../../../domain/model/content/article.entity';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../binding/binding-post/content.interface';
import {
  IReactionQuery,
  REACTION_QUERY_TOKEN,
} from '../../../domain/query-interface/reaction.query.interface';
import { v4 } from 'uuid';
import { TypeActivity, VerbActivity } from '../../../../../notification';

@CommandHandler(ProcessReactionNotificationCommand)
export class ProcessReactionNotificationHandler
  implements ICommandHandler<ProcessReactionNotificationCommand, void>
{
  public constructor(
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userAppService: IUserApplicationService,
    private readonly _kafkaService: KafkaService,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(REACTION_QUERY_TOKEN)
    private readonly _reactionQuery: IReactionQuery
  ) {}

  public async execute(command: ProcessReactionNotificationCommand): Promise<void> {
    const { reaction, action } = command.payload;

    if (reaction.target === REACTION_TARGET.COMMENT) {
      await this._sendReactCommentNotification(reaction, reaction.targetId, action);
    }

    if (reaction.target === REACTION_TARGET.POST || reaction.target === REACTION_TARGET.ARTICLE) {
      await this._sendReactContentNotification(reaction, reaction.targetId, action);
    }
  }

  private async _sendReactCommentNotification(
    reaction: ReactionDto,
    commentId: string,
    action: 'create' | 'delete'
  ): Promise<void> {
    const commentEntity = await this._commentRepository.findOne(
      { id: commentId },
      {
        includeOwnerReactions: reaction.actor.id,
      }
    );
    if (!commentEntity) return;

    const contentEntity = (await this._contentRepository.findOne({
      where: { id: commentEntity.get('postId') },
      include: {
        mustIncludeGroup: true,
      },
    })) as ContentEntity;
    if (!contentEntity) return;

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
      media: {
        files: (contentEntity.get('media').files || []).map((file) => new FileDto(file.toObject())),
        images: (contentEntity.get('media').images || []).map(
          (image) => new ImageDto(image.toObject())
        ),
        videos: (contentEntity.get('media').videos || []).map(
          (video) => new VideoDto(video.toObject())
        ),
      },
      comment: await this._getCommentPayload(reaction, commentEntity),
      createdAt: contentEntity.get('createdAt'),
      updatedAt: contentEntity.get('updatedAt'),
    };
    this._kafkaService.emit(KAFKA_TOPIC.STREAM.REACTION, {
      key: contentEntity.getId(),
      value: {
        actor: reaction.actor,
        event: action === 'create' ? ReactionHasBeenCreated : ReactionHasBeenRemoved,
        data: {
          id: v4(),
          object: activity,
          verb: VerbActivity.REACT,
          target: commentEntity.isChildComment()
            ? TypeActivity.CHILD_COMMENT
            : TypeActivity.COMMENT,
          ignore: [],
          createdAt: reaction.createdAt,
          updatedAt: reaction.createdAt,
        },
      },
    });
  }

  private async _getCommentPayload(
    reaction: ReactionDto,
    commentEntity: CommentEntity
  ): Promise<void> {
    const userIds = [commentEntity.get('createdBy')];
    if (commentEntity.get('mentions')?.length) {
      userIds.push(...commentEntity.get('mentions'));
    }
    const users = await this._userAppService.findAllByIds(userIds);

    let mentionUsersComment = {};
    const commentActor = users.find((user) => user.id === commentEntity.get('createdBy'));
    const reactionsCount = await this._reactionQuery.getAndCountReactionByComments([
      commentEntity.get('id'),
    ]);
    if (commentEntity.get('mentions') && users.length) {
      mentionUsersComment = this._contentBinding.mapMentionWithUserInfo(
        users.filter((user) => commentEntity.get('mentions').includes(user.id))
      );
    }

    let comment;

    let parentCommentEntity = null;
    if (commentEntity.isChildComment()) {
      parentCommentEntity = await this._commentRepository.findOne({
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
        media: {
          files: [],
          images: parentCommentEntity
            .get('media')
            .images.map((image) => new ImageDto(image.toObject())),
          videos: [],
        },
        mentions: this._contentBinding.mapMentionWithUserInfo(
          usersOfParent.filter((user) => parentCommentEntity.get('mentions').includes(user.id))
        ),
        child: {
          id: commentEntity.get('id'),
          actor: commentActor,
          reaction,
          content: commentEntity.get('content'),
          media: {
            files: [],
            images: commentEntity
              .get('media')
              .images.map((image) => new ImageDto(image.toObject())),
            videos: [],
          },
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
        media: {
          files: [],
          images: commentEntity.get('media').images.map((image) => new ImageDto(image.toObject())),
          videos: [],
        },
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
    reaction: ReactionDto,
    contentId: string,
    action: 'create' | 'delete'
  ): Promise<void> {
    const contentEntity = (await this._contentRepository.findOne({
      where: { id: contentId },
      include: {
        mustIncludeGroup: true,
        shouldIncludeReaction: {
          userId: reaction.actor.id,
        },
      },
    })) as ContentEntity;
    if (!contentEntity || contentEntity.isHidden()) return;

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
    const reactionsCount = await this._reactionQuery.getAndCountReactionByContents([
      contentEntity.get('id'),
    ]);
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
      contentType: contentEntity.getType(),
      content: contentEntity instanceof PostEntity ? contentEntity.get('content') : null,
      media:
        contentEntity instanceof PostEntity
          ? {
              files: contentEntity.get('media').files?.map((file) => new FileDto(file.toObject())),
              images: contentEntity
                .get('media')
                .images?.map((image) => new ImageDto(image.toObject())),
              videos: contentEntity
                .get('media')
                .videos?.map((video) => new VideoDto(video.toObject())),
            }
          : {
              files: [],
              images: [],
              videos: [],
            },
      mentions: mentionUsers,
      setting: contentEntity.get('setting'),
      reaction,
      reactionsOfActor: contentEntity.get('ownerReactions'),
      reactionsCount: reactionsCount.get(contentEntity.getId()) || [],
      createdAt: contentEntity.get('createdAt'),
      updatedAt: contentEntity.get('updatedAt'),
    };
    this._kafkaService.emit(KAFKA_TOPIC.STREAM.REACTION, {
      key: contentEntity.getId(),
      value: {
        actor: reaction.actor,
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
