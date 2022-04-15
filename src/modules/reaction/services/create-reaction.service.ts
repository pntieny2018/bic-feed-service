import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { plainToInstance } from 'class-transformer';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { CommentModel } from '../../../database/models/comment.model';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { PostModel } from '../../../database/models/post.model';
import { GroupService } from '../../../shared/group';
import { UserService } from '../../../shared/user';
import { UserSharedDto } from '../../../shared/user/dto';
import { UserDto } from '../../auth';
import { ReactionDto } from '../dto/reaction.dto';
import { CreateReactionDto } from '../dto/request';
import { ReactionResponseDto } from '../dto/response';
import { REACTION_KIND_LIMIT } from '../reaction.constant';
import { ReactionEnum } from '../reaction.enum';
import { CommonReactionService } from './common-reaction.service';
import { LogicException } from '../../../common/exceptions';

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
    @InjectModel(CommentModel)
    private readonly _commentModel: typeof CommentModel,
    private readonly _userService: UserService,
    private readonly _groupService: GroupService,
    private readonly _commonReactionService: CommonReactionService
  ) {}

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

      const [canReact, post] = await this._canReactPost(postId);
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

      const reactionDto = new ReactionDto(createReactionDto, userId);
      this._commonReactionService.createCreateReactionEvent(
        userDto,
        userSharedDto,
        reactionDto,
        postId
      );

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

      const [postId, comment] = await this._getPostIdOfCommentAndComment(commentId);
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

      const reactionDto = new ReactionDto(createReactionDto, userId);
      this._commonReactionService.createCreateReactionEvent(
        userDto,
        userSharedDto,
        reactionDto,
        postId,
        comment.id
      );

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
   * @returns Promise resolve [boolean, PostModel]
   * @throws Error
   */
  private async _canReactPost(postId: number): Promise<[boolean, PostModel]> {
    const post = await this._postModel.findOne<PostModel>({
      where: {
        id: postId,
        canReact: true,
        isDraft: false,
      },
      include: [
        {
          model: PostGroupModel,
          required: true,
        },
      ],
    });
    return [!!post === true, post];
  }

  /**
   * Get postId of a comment and comment
   * @param commentId number
   * @returns Promise resolve [number, CommentModel]
   * @throws Error
   */
  private async _getPostIdOfCommentAndComment(commentId: number): Promise<[number, CommentModel]> {
    const comment = await this._commentModel.findOne<CommentModel>({
      where: {
        id: commentId,
      },
    });
    if (comment === null || !!comment.postId === false) {
      throw new InternalServerErrorException(
        "Database error: comment is not existed or comment's postId is zero-value."
      );
    }
    return [comment.postId, comment];
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
