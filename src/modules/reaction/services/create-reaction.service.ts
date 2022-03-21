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
    const { userId } = userDto;
    switch (createReactionDto.target) {
      case ReactionEnum.POST:
        return this._createPostReaction(userId, createReactionDto);
      case ReactionEnum.COMMENT:
        return this._createCommentReaction(userId, createReactionDto);
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

      const canReact = await this._canReactPost(postId);
      if (canReact === false) {
        throw new Error('Post does not permit to react.');
      }

      const isUserInPostGroups = await this._isUserInPostGroups(userId, postId);
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

      const reactionDto = new ReactionDto(createReactionDto, userId);
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

      const postId = await this._getPostIdOfComment(commentId);
      const isUserInPostGroups = await this._isUserInPostGroups(userId, postId);
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

      const reactionDto = new ReactionDto(createReactionDto, userId);
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
   * @returns Promise resolve boolean
   * @throws Error
   */
  private async _canReactPost(postId: number): Promise<boolean> {
    const post = await this._postModel.findOne<PostModel>({
      where: {
        id: postId,
        canReact: true,
        isDraft: false,
      },
    });
    return !!post === true;
  }

  /**
   *
   * Get postId of a comment
   * @param commentId number
   * @returns Promise resolve number
   * @throws Error
   */
  private async _getPostIdOfComment(commentId: number): Promise<number> {
    const post = await this._commentModel.findOne<CommentModel>({
      attributes: ['id'],
      where: {
        id: commentId,
      },
    });
    if (!!post === false) {
      throw new Error('Database error: Comment is not belong to any post.');
    }
    return post.id;
  }

  /**
   *
   * Is user in post's groups
   * @param userId number
   * @param postId number
   * @returns Promise resolve boolean
   */
  private async _isUserInPostGroups(userId: number, postId: number): Promise<boolean> {
    const postGroups = await this._postGroupModel.findAll<PostGroupModel>({
      where: {
        postId: postId,
      },
    });
    const userSharedDto = await this._userService.get(userId);
    if (!!userSharedDto === false) {
      throw new Error('Can not get user data by UserService.');
    }
    const groupIds = postGroups.map((postGroup: PostGroupModel) => postGroup.groupId);
    const userGroupIds = userSharedDto.groups;
    return this._groupService.isMemberOfSomeGroups(groupIds, userGroupIds);
  }
}
