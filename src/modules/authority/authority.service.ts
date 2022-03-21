import { UserDto } from '../auth';
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { EntityIdDto } from '../../common/dto';
import { InjectModel } from '@nestjs/sequelize';
import { GroupService } from '../../shared/group';
import { IPost, PostModel } from '../../database/models/post.model';
import { CommentModel } from '../../database/models/comment.model';
import { PostGroupModel } from '../../database/models/post-group.model';

@Injectable()
export class AuthorityService {
  public constructor(
    @InjectModel(PostModel)
    private _postModel: typeof PostModel,
    private _commentModel: typeof CommentModel,
    private _groupService: GroupService
  ) {}

  public async allowAccess(user: UserDto, entity: EntityIdDto): Promise<IPost> {
    let groupIds = [];
    let post: IPost = null;

    if (entity.postId) {
      post = await this._postModel.findOne({
        include: [
          {
            model: PostGroupModel,
            as: 'groups',
            attributes: ['groupId'],
          },
        ],
        where: {
          id: entity.postId,
        },
      });
      groupIds = (post?.groups ?? []).map((g) => g.groupId);
    }

    if (entity.commentId) {
      const comment = await this._commentModel.findOne({
        include: [
          {
            model: PostModel,
            as: 'post',
            include: [
              {
                model: PostGroupModel,
                as: 'groups',
              },
            ],
          },
        ],
        where: {
          id: entity.commentId,
        },
      });
      groupIds = (comment?.post?.groups ?? []).map((g) => g.groupId);
      post = comment?.post;
    }

    if (entity.reactionId) {
      //TODO: wait merge code
    }

    if (!post) {
      throw new BadRequestException('The post does not exist !');
    }

    const canAccess = this._groupService.isMemberOfSomeGroups(groupIds, user.profile.groups);

    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to perform this action !');
    }

    return post;
  }
}
