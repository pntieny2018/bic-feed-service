import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateReactionDto } from '../dto/request';
import { PostReactionModel } from '../../../database/models/post-reaction.model';
import { CommentReactionModel } from 'src/database/models/comment-reaction.model';
import { ReactionEnum } from '../reaction.enum';
import { UserDto } from '../../auth';
import { REACTION_KIND_LIMIT } from '../reaction.constant';
import { PostModel } from 'src/database/models/post.model';
import { PostGroupModel } from 'src/database/models/post-group';
import { UserService } from 'src/shared/user';
import { CommentModel } from 'src/database/models/comment.model';

//TODO: check if user is in the group that contains the post.
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
    private readonly _userService: UserService
  ) {}

  /**
   * Create reaction
   * @param userDto UserDto
   * @param createReactionDto CreateReactionDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public createReaction(userDto: UserDto, createReactionDto: CreateReactionDto): Promise<boolean> {
    const { userId } = userDto;
    switch (createReactionDto.target) {
      case ReactionEnum.POST:
        return this._createPostReaction(userId, createReactionDto);
      case ReactionEnum.COMMENT:
        return this._createCommentReaction(userId, createReactionDto);
      default:
        throw new HttpException('Reaction type not match.', HttpStatus.NOT_FOUND);
    }

    //TODO: pub topic to kafka
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
  ): Promise<boolean> {
    const { reactionName, targetId: postId } = createReactionDto;
    try {
      const existedReaction = await this._postReactionModel.findOne<PostReactionModel>({
        where: {
          postId: postId,
          reactionName: reactionName,
          createdBy: userId,
        },
      });
      if (!!existedReaction === true) {
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

      const reactions = await this._postReactionModel.findAll<PostReactionModel>({
        attributes: [['reaction_name', 'reactionName']],
        where: {
          postId: postId,
        },
        group: ['reaction_name'],
      });
      const willExceedReactionKindLim = this._willExceedReactionKindLim(reactions, reactionName);
      if (willExceedReactionKindLim === true) {
        throw new Error('Exceed reaction kind limit on a post.');
      }

      await this._postReactionModel.create<PostReactionModel>({
        postId: postId,
        reactionName: reactionName,
        createdBy: userId,
      });

      return true;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw new HttpException('Can not create reaction.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
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
  ): Promise<boolean> {
    const { reactionName, targetId: commentId } = createReactionDto;
    try {
      const existedReaction = await this._commentReactionModel.findOne<CommentReactionModel>({
        where: {
          commentId: commentId,
          reactionName: reactionName,
          createdBy: userId,
        },
      });
      if (!!existedReaction === true) {
        throw new Error('Reaction is existed.');
      }

      const postId = await this._getPostIdOfComment(commentId);
      const isUserInPostGroups = await this._isUserInPostGroups(userId, postId);
      if (isUserInPostGroups === false) {
        throw new Error("User is not in the post's groups.");
      }

      const reactions = await this._commentReactionModel.findAll<CommentReactionModel>({
        attributes: [['reaction_name', 'reactionName']],
        where: {
          commentId: commentId,
        },
        group: ['reaction_name'],
      });
      const willExceedReactionKindLim = this._willExceedReactionKindLim(reactions, reactionName);
      if (willExceedReactionKindLim === true) {
        throw new Error('Exceed reaction kind limit on a comment.');
      }

      await this._commentReactionModel.create<CommentReactionModel>({
        commentId: commentId,
        reactionName: reactionName,
        createdBy: userId,
      });

      return true;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw new HttpException('Can not create reaction.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async _canReactPost(postId: number): Promise<boolean> {
    const post = await this._postModel.findOne<PostModel>({
      where: {
        id: postId,
      },
    });
    if (!!post === false) {
      throw new Error('Post is not existed.');
    }
    const { canReact, isDraft } = post;
    return canReact === true && isDraft === false;
  }

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

  private async _isUserInPostGroups(userId: number, postId: number): Promise<boolean> {
    const postGroups = await this._postGroupModel.findAll<PostGroupModel>({
      where: {
        postId: postId,
      },
    });
    const userSharedDto = await this._userService.get(userId);
    const groupIds = postGroups.map((postGroup: PostGroupModel) => postGroup.groupId);
    const userGroupIds = userSharedDto.groups;
    return this._userService.isMemberOfGroups(groupIds, userGroupIds);
  }

  private _willExceedReactionKindLim(
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
}
