import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateReactionDto } from '../dto/request';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { ReactionEnum } from '../reaction.enum';
import { UserDto } from '../../auth';
import { REACTION_KIND_LIMIT } from '../reaction.constant';
import { CommentReactionModel } from '../../../database/models/comment-reaction.model';
import { PostModel } from '../../../database/models/post.model';
import { PostGroupModel } from '../../../database/models/post-group.model';
import { CommentModel } from '../../../database/models/comment.model';
import { UserService } from '../../../shared/user';
import { GroupService } from '../../../shared/group';
import { CommonReactionService } from './common-reaction.service';
import { ReactionDto } from '../dto/reaction.dto';
import { UserSharedDto } from '../../../shared/user/dto';

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
  ): Promise<ReactionDto> {
    const { id } = userDto;
    switch (createReactionDto.target) {
      case ReactionEnum.POST:
        return this._createPostReaction(id, createReactionDto);
      case ReactionEnum.COMMENT:
        return this._createCommentReaction(id, createReactionDto);
      default:
        throw new HttpException('Reaction type not match.', HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Create post reaction
   * @param userId number
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  private async _createPostReaction(
    userId: number,
    createReactionDto: CreateReactionDto
  ): Promise<ReactionDto> {
    const { reactionName, targetId: postId } = createReactionDto;
    try {
      const isExistedPostReaction = await this._commonReactionService.isExistedPostReaction(
        userId,
        createReactionDto
      );
      if (isExistedPostReaction === true) {
        throw new Error('Reaction is existed.');
      }

      const [canReact, post] = await this._canReactPost(postId);
      if (canReact === false) {
        throw new Error('Post does not permit to react.');
      }

      const userSharedDto = await this._userService.get(userId);
      const isUserInPostGroups = await this._isUserInPostGroups(userSharedDto, postId);
      if (isUserInPostGroups === false) {
        throw new Error("User is not in the post's groups");
      }

      const willExceedPostReactionKindLimit = await this._willExceedPostReactionKindLimit(
        postId,
        reactionName
      );
      if (willExceedPostReactionKindLimit === true) {
        throw new Error('Exceed reaction kind limit on a post.');
      }

      await this._postReactionModel.create<PostReactionModel>({
        postId: postId,
        reactionName: reactionName,
        createdBy: userId,
      });

      const reactionDto = new ReactionDto(createReactionDto, userSharedDto);
      this._commonReactionService.createEvent(reactionDto, post.toJSON());

      return reactionDto;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw new HttpException('Can not create reaction.', HttpStatus.INTERNAL_SERVER_ERROR);
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
   * @param userId number
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  private async _createCommentReaction(
    userId: number,
    createReactionDto: CreateReactionDto
  ): Promise<ReactionDto> {
    const { reactionName, targetId: commentId } = createReactionDto;
    try {
      const isExistedCommentReaction = await this._commonReactionService.isExistedCommentReaction(
        userId,
        createReactionDto
      );
      if (isExistedCommentReaction === true) {
        throw new Error('Reaction is existed.');
      }

      const [postId, comment] = await this._getPostIdOfCommentAndComment(commentId);
      const post = await this._getPost(postId);
      const userSharedDto = await this._userService.get(userId);
      const isUserInPostGroups = await this._isUserInPostGroups(userSharedDto, postId);
      if (isUserInPostGroups === false) {
        throw new Error("User is not in the post's groups.");
      }

      const willExceedCommentReactionKindLimit = await this._willExceedCommentReactionKindLimit(
        commentId,
        reactionName
      );
      if (willExceedCommentReactionKindLimit === true) {
        throw new Error('Exceed reaction kind limit on a comment.');
      }

      await this._commentReactionModel.create<CommentReactionModel>({
        commentId: commentId,
        reactionName: reactionName,
        createdBy: userId,
      });

      const reactionDto = new ReactionDto(createReactionDto, userSharedDto);

      this._commonReactionService.createEvent(reactionDto, post.toJSON(), comment.toJSON());

      return reactionDto;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw new HttpException('Can not create reaction.', HttpStatus.INTERNAL_SERVER_ERROR);
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
      throw new Error("Database error: comment is not existed or comment's postId is zero-value.");
    }
    return [comment.postId, comment];
  }

  /**
   * Get post by id
   * @param postId number
   * @returns Promise resolve PostModel
   * @throws Error
   */
  private async _getPost(postId: number): Promise<PostModel> {
    const post = await this._postModel.findOne<PostModel>({
      where: {
        id: postId,
      },
      include: [
        {
          model: PostGroupModel,
          required: true,
        },
      ],
    });
    if (!!post === false) {
      throw new Error('Database error: Comment is belong to a non-existed post.');
    }
    return post;
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
      throw new Error(
        'Can not get data of user on cache. Unable to check whether user is in the group.'
      );
    }
    const groupIds = postGroups.map((postGroup: PostGroupModel) => postGroup.groupId);
    const userGroupIds = userSharedDto.groups;
    return this._groupService.isMemberOfSomeGroups(groupIds, userGroupIds);
  }
}
