import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { plainToInstance } from 'class-transformer';
import { LogicException } from '../../../common/exceptions';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { PostModel } from '../../../database/models/post.model';
import { GroupService } from '../../../shared/group';
import { UserService } from '../../../shared/user';
import { UserSharedDto } from '../../../shared/user/dto';
import { UserDto } from '../../auth';
import { ReactionDto } from '../dto/reaction.dto';
import { CreateReactionDto, JobReactionDataDto, ReactionAction } from '../dto/request';
import { ReactionResponseDto } from '../dto/response';
import { REACTION_KIND_LIMIT } from '../reaction.constant';
import { ReactionEnum } from '../reaction.enum';
import { CommonReactionService } from './common-reaction.service';
import Bull, { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { IRedisConfig } from '../../../config/redis';
import { DeleteReactionService } from './delete-reaction.service';

@Injectable()
export class CreateReactionService {
  private _logger = new Logger(CreateReactionService.name);

  public constructor(
    @InjectModel(PostReactionModel)
    private readonly _postReactionModel: typeof PostReactionModel,
    @InjectModel(CommentReactionModel)
    private readonly _commentReactionModel: typeof CommentReactionModel,
    @InjectModel(PostModel)
    private readonly _postModel: typeof PostModel,
    @InjectModel(PostGroupModel)
    private readonly _postGroupModel: typeof PostGroupModel,
    private readonly _userService: UserService,
    private readonly _groupService: GroupService,
    private readonly _commonReactionService: CommonReactionService,
    private readonly _configService: ConfigService,
    @Inject(forwardRef(() => DeleteReactionService))
    private readonly _deleteReactionService: DeleteReactionService
  ) {}

  public async addToQueueCreateReaction(
    userDto: UserDto,
    createReactionDto: CreateReactionDto
  ): Promise<void> {
    const queueName = `Q${createReactionDto.target.toString()}:${createReactionDto.targetId}`;
    const redisConfig = this._configService.get<IRedisConfig>('redis');
    const sslConfig = redisConfig.ssl
      ? {
          tls: {
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
          },
        }
      : {};

    const queue = new Bull(queueName, {
      redis: {
        keyPrefix: redisConfig.prefix,
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        ...sslConfig,
      },
    });

    queue.add(
      {
        action: ReactionAction.CREATE,
        userDto,
        createReactionDto,
      },
      {
        removeOnComplete: false,
        removeOnFail: false,
      }
    );
    queue.process(async (job: Job<JobReactionDataDto>) => {
      if (job.data.action === ReactionAction.CREATE) {
        return await this.createReaction(job.data.userDto, job.data.createReactionDto);
      } else if (job.data.action === ReactionAction.DELETE) {
        //FIXME: will refactor after done phase 2
        return await this._deleteReactionService.deleteReaction(
          job.data.userDto,
          job.data.deleteReactionDto
        );
      }
      return;
    });
    queue.on('completed', (job, result) => {
      this._logger.debug(`\n ${job.queue.name} Job completed with result:`, result);
    });
  }
  /**
   * Create reaction
   * @param userDto UserDto
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
   */
  public createReaction(
    userDto: UserDto,
    createReactionDto: CreateReactionDto
  ): Promise<ReactionResponseDto> {
    switch (createReactionDto.target) {
      case ReactionEnum.POST:
        return this._createPostReaction(userDto, createReactionDto);
      case ReactionEnum.COMMENT:
        return this._createCommentReaction(userDto, createReactionDto);
      default:
        throw new NotFoundException('Reaction type not match.');
    }
  }

  /**
   * Create post reaction
   * @param userDto UserDto
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve ReactionResponseDto
   * @throws HttpException
   */
  private async _createPostReaction(
    userDto: UserDto,
    createReactionDto: CreateReactionDto
  ): Promise<ReactionResponseDto> {
    const { id: userId } = userDto;
    const { reactionName, targetId: postId } = createReactionDto;
    try {
      const isExistedPostReaction = await this._commonReactionService.isExistedPostReaction(
        userId,
        createReactionDto
      );
      if (isExistedPostReaction === true) {
        throw new LogicException('Reaction is existed.');
      }

      const canReact = await this._canReactPost(postId);
      if (canReact === false) {
        throw new LogicException('Post does not permit to react.');
      }

      const userSharedDto = await this._userService.get(userId);
      const isUserInPostGroups = await this._isUserInPostGroups(userSharedDto, postId);
      if (isUserInPostGroups === false) {
        throw new ForbiddenException("User is not in the post's groups");
      }

      const willExceedPostReactionKindLimit = await this._willExceedPostReactionKindLimit(
        postId,
        reactionName
      );
      if (willExceedPostReactionKindLimit === true) {
        throw new LogicException('Exceed reaction kind limit on a post.');
      }

      const postReaction = await this._postReactionModel.create<PostReactionModel>({
        postId: postId,
        reactionName: reactionName,
        createdBy: userId,
      });

      const reactionDto = new ReactionDto(createReactionDto, {
        userId: userId,
        createdAt: postReaction.createdAt,
        reactionId: postReaction.id,
      });

      this._commonReactionService
        .createCreateReactionEvent(userSharedDto, reactionDto, postId)
        .catch((e) => this._logger.error(e, e?.stack));

      return plainToInstance(ReactionResponseDto, postReaction, { excludeExtraneousValues: true });
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw e;
    }
  }

  /**
   * Will exceed post reaction kind limit
   * @param postId number
   * @param reactionName string
   * @returns Promise resolve boolean
   */
  private async _willExceedPostReactionKindLimit(
    postId: number,
    reactionName: string
  ): Promise<boolean> {
    const reactions = await this._postReactionModel.findAll<PostReactionModel>({
      attributes: ['reactionName'],
      where: {
        postId: postId,
      },
      group: ['reactionName'],
    });
    return this._willExceedReactionKindLimit(reactions, reactionName);
  }

  /**
   * Create comment reaction
   * @param userDto UserDto
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve ReactionResponseDto
   * @throws HttpException
   */
  private async _createCommentReaction(
    userDto: UserDto,
    createReactionDto: CreateReactionDto
  ): Promise<ReactionResponseDto> {
    const { id: userId } = userDto;
    const { reactionName, targetId: commentId } = createReactionDto;
    try {
      const isExistedCommentReaction = await this._commonReactionService.isExistedCommentReaction(
        userId,
        createReactionDto
      );
      if (isExistedCommentReaction === true) {
        throw new LogicException('Reaction is existed.');
      }

      const { postId } = await this._commonReactionService.getComment(commentId);
      const userSharedDto = await this._userService.get(userId);
      const isUserInPostGroups = await this._isUserInPostGroups(userSharedDto, postId);
      if (isUserInPostGroups === false) {
        throw new ForbiddenException("User is not in the post's groups.");
      }

      const willExceedCommentReactionKindLimit = await this._willExceedCommentReactionKindLimit(
        commentId,
        reactionName
      );
      if (willExceedCommentReactionKindLimit === true) {
        throw new LogicException('Exceed reaction kind limit on a comment.');
      }

      const commentReaction = await this._commentReactionModel.create<CommentReactionModel>({
        commentId: commentId,
        reactionName: reactionName,
        createdBy: userId,
      });

      const reactionDto = new ReactionDto(createReactionDto, {
        userId: userId,
        createdAt: commentReaction.createdAt,
        reactionId: commentReaction.id,
      });

      this._commonReactionService
        .createCreateReactionEvent(userSharedDto, reactionDto, postId, commentId)
        .catch((e) => this._logger.error(e, e?.stack));

      return plainToInstance(ReactionResponseDto, commentReaction, {
        excludeExtraneousValues: true,
      });
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw e;
    }
  }

  /**
   * Will exceed comment reaction kind limit
   * @param commentId number
   * @param reactionName string
   * @returns Promise resolve boolean
   */
  private async _willExceedCommentReactionKindLimit(
    commentId: number,
    reactionName: string
  ): Promise<boolean> {
    const reactions = await this._commentReactionModel.findAll<CommentReactionModel>({
      attributes: ['reactionName'],
      where: {
        commentId: commentId,
      },
      group: ['reactionName'],
    });
    return this._willExceedReactionKindLimit(reactions, reactionName);
  }

  /**
   * Will exceed reaction kind limit on a post or a comment
   * @param reactions PostReactionModel[] | CommentReactionModel[]
   * @param reactionName string
   * @returns Promise resolve boolean
   */
  private _willExceedReactionKindLimit(
    reactions: PostReactionModel[] | CommentReactionModel[],
    reactionName: string
  ): boolean {
    const isExistedReactionKind = reactions.findIndex(
      (reaction: PostReactionModel | CommentReactionModel) => {
        return reaction.reactionName === reactionName;
      }
    );
    if (isExistedReactionKind >= 0) {
      return false;
    }
    const currentReactionKindNum = reactions.length;
    const newReactionKindNum = 1;
    return currentReactionKindNum + newReactionKindNum > REACTION_KIND_LIMIT;
  }

  /**
   * Can react post by checking the fields **canReact** and **isDraft**
   * @param postId number
   * @returns Promise resolve boolean
   */
  private async _canReactPost(postId: number): Promise<boolean> {
    const post = await this._postModel.findOne<PostModel>({
      where: {
        id: postId,
        canReact: true,
        isDraft: false,
      },
    });
    return !!post;
  }

  /**
   *
   * Is user in post's groups
   * @param userSharedDto UserSharedDto
   * @param postId number
   * @returns Promise resolve boolean
   */
  private async _isUserInPostGroups(
    userSharedDto: UserSharedDto,
    postId: number
  ): Promise<boolean> {
    const postGroups = await this._postGroupModel.findAll<PostGroupModel>({
      where: {
        postId: postId,
      },
    });
    if (!!userSharedDto === false) {
      throw new InternalServerErrorException(
        'Can not get data of user on cache. Unable to check whether user is in the group.'
      );
    }
    const groupIds = postGroups.map((postGroup: PostGroupModel) => postGroup.groupId);
    const userGroupIds = userSharedDto.groups;
    return this._groupService.isMemberOfSomeGroups(groupIds, userGroupIds);
  }
}
