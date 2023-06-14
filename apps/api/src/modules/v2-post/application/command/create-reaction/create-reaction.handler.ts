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
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
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

  public async execute(command: CreateReactionCommand): Promise<ReactionDto> {
    const newCreateReactionDto = CreateReactionHandler.transformReactionNameNodeEmoji(
      command.payload
    );
    await this._validate(command);
    const newReactionEntity = await this._reactionDomainService.createReaction(
      newCreateReactionDto
    );
    const actors = await this._userAppService.findOne(newReactionEntity.get('createdBy'));

    if (newCreateReactionDto.target === REACTION_TARGET.COMMENT) {
      this._sendReactCommentNotification(newReactionEntity, newCreateReactionDto.targetId);
    }

    return new ReactionDto({
      id: newReactionEntity.get('id'),
      reactionName: newReactionEntity.get('reactionName'),
      createdAt: newReactionEntity.get('createdAt'),
      actor: actors,
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
    commentId: string
  ): Promise<void> {
    const commentEntity = await this._commentRepository.findOne({ id: commentId });
    if (!commentEntity) return;
    const postEntity = (await this._contentRepository.findOne({
      where: { id: commentEntity.get('postId') },
      include: {
        mustIncludeGroup: true,
      },
    })) as ContentEntity;
    if (!postEntity) return;

    const userIds = [
      postEntity.get('createdBy'),
      commentEntity.get('createdBy'),
      ...commentEntity.get('mentions'),
    ];
    if (postEntity instanceof PostEntity) {
      userIds.push(...postEntity.get('mentionUserIds'));
    }
    const users = await this._userAppService.findAllByIds(userIds);
    let mentionUsers = {};
    let mentionUsersComment = {};
    if (postEntity instanceof PostEntity && postEntity.get('mentionUserIds') && users.length) {
      mentionUsers = this._contentBinding.mapMentionWithUserInfo(
        users.filter((user) => postEntity.get('mentionUserIds').includes(user.id))
      );
    }

    if (commentEntity.get('mentions') && users.length) {
      mentionUsersComment = this._contentBinding.mapMentionWithUserInfo(
        users.filter((user) => commentEntity.get('mentions').includes(user.id))
      );
    }

    const contentActor = users.find((user) => user.id === postEntity.get('createdBy'));
    const commentActor = users.find((user) => user.id === commentEntity.get('createdBy'));

    const groups = this._groupAppService.findAllByIds(postEntity.get('groupIds'));
    const activity = {
      id: postEntity.getId(),
      actor: contentActor,
      audience: {
        groups,
      },
      title:
        postEntity instanceof ArticleEntity || postEntity instanceof PostEntity
          ? postEntity.get('title')
          : null,
      contentType: postEntity.get('type'),
      content: postEntity instanceof PostEntity ? postEntity.get('content') : null,
      mentions: mentionUsers,
      setting: postEntity.get('setting'),
      media: {
        files: postEntity.get('media').files.map((file) => new FileDto(file.toObject())),
        images: postEntity.get('media').images.map((image) => new ImageDto(image.toObject())),
        videos: postEntity.get('media').videos.map((video) => new VideoDto(video.toObject())),
      },
      comment: {
        id: commentEntity.get('id'),
        actor: commentActor,
        reaction: commentEntity.get('reaction'),
        content: commentEntity.get('content'),
        media: {
          files: [],
          images: commentEntity.get('media').images.map((image) => new ImageDto(image.toObject())),
          videos: [],
        },
        mentions: mentionUsersComment,
        reactionsCount: comment.reactionsCount,
        reactionsOfActor: ownerReactions,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
      createdAt: postEntity.get('createdAt'),
      updatedAt: postEntity.get('updatedAt'),
    };
    this._kafkaService.emit(KAFKA_TOPIC.STREAM.REACTION, {
      key: postEntityAfter.getId(),
      value: {
        actor: reaction.actor,
        event: ReactionHasBeenCreated,
        data: activity,
      },
    });
  }
}
