import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateReactionCommand } from './create-reaction.command';
import {
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/post-reaction.repository.interface';
import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/reaction.domain-service.interface';
import {
  COMMENT_REACTION_REPOSITORY_TOKEN,
  ICommentReactionRepository,
} from '../../../domain/repositoty-interface/comment-reaction.repository.interface';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../../v2-user/application';
import { ReactionDuplicateException } from '../../../domain/exception/reaction-duplicate.exception';
import { REACTION_TARGET } from '../../../data-type/reaction-target.enum';
import { FileDto, ImageDto, ReactionDto, VideoDto } from '../../dto';
import { ContentNoReactPermissionException } from '../../../domain/exception/content-no-react-permission.exception';
import { KafkaService } from '@app/kafka';
import { KAFKA_TOPIC } from '@app/kafka/kafka.constant';
import { PostChangedMessagePayload } from '../../dto/message/post-published.message-payload';
import { ReactionHasBeenCreated } from '../../../../../common/constants';
import { ObjectHelper } from '../../../../../common/helpers';
import { ReactionEntity } from '../../../domain/model/reaction';
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
import { COMMENT_QUERY_TOKEN, ICommentQuery } from '../../../domain/query-interface';
import {
  IReactionQuery,
  REACTION_QUERY_TOKEN,
} from '../../../domain/query-interface/reaction.query.interface';
import { v4 } from 'uuid';
import { TypeActivity, VerbActivity } from '../../../../../notification';

@CommandHandler(CreateReactionCommand)
export class CreateReactionHandler implements ICommandHandler<CreateReactionCommand, ReactionDto> {
  @Inject(POST_REACTION_REPOSITORY_TOKEN)
  private readonly _postReactionRepository: IPostReactionRepository;
  @Inject(COMMENT_REACTION_REPOSITORY_TOKEN)
  private readonly _commentReactionRepository: ICommentReactionRepository;
  @Inject(REACTION_DOMAIN_SERVICE_TOKEN)
  private readonly _reactionDomainService: IReactionDomainService;
  @Inject(USER_APPLICATION_TOKEN) private readonly _userAppService: IUserApplicationService;
  private readonly _kafkaService: KafkaService;
  @Inject(COMMENT_REPOSITORY_TOKEN)
  private readonly _commentRepository: ICommentRepository;
  @Inject(CONTENT_REPOSITORY_TOKEN)
  private readonly _contentRepository: IContentRepository;
  @Inject(GROUP_APPLICATION_TOKEN)
  private readonly _groupAppService: IGroupApplicationService;
  @Inject(CONTENT_BINDING_TOKEN)
  private readonly _contentBinding: IContentBinding;
  @Inject(COMMENT_QUERY_TOKEN)
  private readonly _commentQuery: ICommentQuery;
  @Inject(REACTION_QUERY_TOKEN)
  private readonly _reactionQuery: IReactionQuery;

  public async execute(command: CreateReactionCommand): Promise<ReactionDto> {
    const newCreateReactionDto = CreateReactionHandler.transformReactionNameNodeEmoji(
      command.payload
    );
    await this._validate(command);
    const newReactionEntity = await this._reactionDomainService.createReaction(
      newCreateReactionDto
    );
    const actor = await this._userAppService.findOne(newReactionEntity.get('createdBy'));

    if (newCreateReactionDto.target === REACTION_TARGET.COMMENT) {
      await this._sendReactCommentNotification(
        newReactionEntity,
        newCreateReactionDto.targetId,
        actor
      );
    }

    if (
      newCreateReactionDto.target === REACTION_TARGET.POST ||
      newCreateReactionDto.target === REACTION_TARGET.ARTICLE
    ) {
      await this._sendReactContentNotification(
        newReactionEntity,
        newCreateReactionDto.targetId,
        actor
      );
    }

    return new ReactionDto({
      id: newReactionEntity.get('id'),
      reactionName: newReactionEntity.get('reactionName'),
      createdAt: newReactionEntity.get('createdAt'),
      actor,
    });
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

  private async _validate(command: CreateReactionCommand): Promise<void> {
    let reactionEntity;
    const newCreateReactionDto = CreateReactionHandler.transformReactionNameNodeEmoji(
      command.payload
    );
    if (command.payload.target === REACTION_TARGET.COMMENT) {
      reactionEntity = await this._commentReactionRepository.findOne({
        commentId: newCreateReactionDto.targetId,
        createdBy: newCreateReactionDto.createdBy,
        reactionName: newCreateReactionDto.reactionName,
      });
    } else {
      reactionEntity = await this._postReactionRepository.findOne({
        postId: newCreateReactionDto.targetId,
        createdBy: newCreateReactionDto.createdBy,
        reactionName: newCreateReactionDto.reactionName,
      });
    }
    if (reactionEntity) {
      throw new ReactionDuplicateException();
    }

    if (newCreateReactionDto.target !== REACTION_TARGET.COMMENT && !reactionEntity.allowReact()) {
      throw new ContentNoReactPermissionException();
    }
  }

  private async _sendReactCommentNotification(
    reaction: ReactionEntity,
    commentId: string,
    actor: UserDto
  ): Promise<void> {
    const commentEntity = await this._commentRepository.findOne({ id: commentId });
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

    const groups = this._groupAppService.findAllByIds(contentEntity.get('groupIds'));
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
        files: contentEntity.get('media').files.map((file) => new FileDto(file.toObject())),
        images: contentEntity.get('media').images.map((image) => new ImageDto(image.toObject())),
        videos: contentEntity.get('media').videos.map((video) => new VideoDto(video.toObject())),
      },
      comment: this._getCommentPayload(reaction, commentId),
      createdAt: contentEntity.get('createdAt'),
      updatedAt: contentEntity.get('updatedAt'),
    };
    this._kafkaService.emit(KAFKA_TOPIC.STREAM.REACTION, {
      key: contentEntity.getId(),
      value: {
        actor: actor,
        event: ReactionHasBeenCreated,
        data: {
          id: v4(),
          object: activity,
          verb: VerbActivity.REACT,
          target: TypeActivity.COMMENT,
          ignore: [],
          createdAt: reaction.get('createdAt'),
          updatedAt: reaction.get('createdAt'),
        },
      },
    });
  }

  private async _getCommentPayload(reaction: ReactionEntity, commentId: string): Promise<void> {
    const commentEntity = await this._commentRepository.findOne({ id: commentId });
    if (!commentEntity) return;

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
      const userIdsOfParent = [parentCommentEntity.geT('createdBy')];
      if (parentCommentEntity.get('mentions')?.length) {
        userIdsOfParent.push(...parentCommentEntity.get('mentions'));
      }
      const usersOfParent = await this._userAppService.findAllByIds(userIdsOfParent);
      comment = {
        id: commentEntity.get('id'),
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
          reaction: reaction.toObject(),
          content: commentEntity.get('content'),
          media: {
            files: [],
            images: commentEntity
              .get('media')
              .images.map((image) => new ImageDto(image.toObject())),
            videos: [],
          },
          mentions: mentionUsersComment,
          reactionsCount,
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
        reaction: reaction.toObject(),
        content: commentEntity.get('content'),
        media: {
          files: [],
          images: commentEntity.get('media').images.map((image) => new ImageDto(image.toObject())),
          videos: [],
        },
        mentions: mentionUsersComment,
        reactionsCount,
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
    reaction: ReactionEntity,
    contentId: string,
    actor: UserDto
  ): Promise<void> {
    const contentEntity = (await this._contentRepository.findOne({
      where: { id: contentId },
      include: {
        mustIncludeGroup: true,
        shouldIncludeReaction: {
          userId: actor.id,
        },
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
    const reactionsCount = await this._reactionQuery.getAndCountReactionByContents([
      contentEntity.get('id'),
    ]);
    const groups = this._groupAppService.findAllByIds(contentEntity.get('groupIds'));
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
      reaction: reaction.toObject(),
      reactionsOfActor: contentEntity.get('ownerReactions'),
      reactionsCount,
      createdAt: contentEntity.get('createdAt'),
      updatedAt: contentEntity.get('updatedAt'),
    };
    this._kafkaService.emit(KAFKA_TOPIC.STREAM.REACTION, {
      key: contentEntity.getId(),
      value: {
        actor: actor,
        event: ReactionHasBeenCreated,
        data: {
          id: v4(),
          object: activity,
          verb: VerbActivity.REACT,
          target: TypeActivity.POST,
          ignore: [],
          createdAt: reaction.get('createdAt'),
          updatedAt: reaction.get('createdAt'),
        },
      },
    });
  }
}
