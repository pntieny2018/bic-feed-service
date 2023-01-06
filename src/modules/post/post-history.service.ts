import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClassTransformer, plainToInstance } from 'class-transformer';
import { PageDto } from '../../common/dto';
import { PostEditedHistoryModel } from '../../database/models/post-edited-history.model';
import { UserDto } from '../auth';
import { AuthorityService } from '../authority';
import { GetPostEditedHistoryDto } from './dto/requests';
import { PostEditedHistoryDto, PostResponseDto } from './dto/responses';
import { PostService } from './post.service';
import { PostStatus } from '../../database/models/post.model';

@Injectable()
export class PostHistoryService {
  /**
   * Logger
   * @protected
   */
  protected logger = new Logger(PostHistoryService.name);

  /**
   *  ClassTransformer
   * @protected
   */
  protected classTransformer = new ClassTransformer();

  public constructor(
    @InjectModel(PostEditedHistoryModel)
    private readonly _postEditedHistoryModel: typeof PostEditedHistoryModel,
    private readonly _postService: PostService,
    private readonly _authorityService: AuthorityService
  ) {}

  /**
   * Save post edited history
   * @param postId string
   * @param Object { oldData: PostResponseDto; newData: PostResponseDto }
   * @returns Promise resolve void
   */
  public async saveEditedHistory(
    postId: string,
    { oldData, newData }: { oldData: PostResponseDto; newData: PostResponseDto }
  ): Promise<any> {
    return this._postEditedHistoryModel.create({
      postId: postId,
      editedAt: newData.updatedAt ?? newData.createdAt,
      oldData: oldData,
      newData: newData,
    });
  }

  /**
   * Delete post edited history
   * @param postId string
   */
  public async deleteEditedHistory(postId: string): Promise<any> {
    return this._postEditedHistoryModel.destroy({
      where: {
        postId: postId,
      },
    });
  }

  /**
   * Get post edited history
   * @param user UserDto
   * @param postId string
   * @param getPostEditedHistoryDto GetPostEditedHistoryDto
   * @returns Promise resolve PageDto
   */
  public async getEditedHistory(
    user: UserDto,
    postId: string,
    getPostEditedHistoryDto: GetPostEditedHistoryDto
  ): Promise<PageDto<PostEditedHistoryDto>> {
    try {
      const post = await this._postService.findPost({ postId: postId });
      await this._authorityService.checkPostOwner(post, user.id);
      const { offset, limit, order } = getPostEditedHistoryDto;

      if (post.status === PostStatus.DRAFT) {
        return new PageDto([], {
          limit: limit,
          total: 0,
        });
      }

      const conditions = {};
      conditions['postId'] = postId;

      const { rows, count } = await this._postEditedHistoryModel.findAndCountAll({
        where: {
          ...conditions,
        },
        order: [['id', order]],
        offset: offset,
        limit: limit,
      });

      const result = rows.map((e) => {
        const newData: PostResponseDto = e.toJSON().newData;
        return plainToInstance(
          PostEditedHistoryDto,
          {
            ...newData,
            postId: newData.id,
            editedAt: newData.updatedAt ?? newData.createdAt,
          },
          { excludeExtraneousValues: true }
        );
      });

      return new PageDto(result, {
        limit: limit,
        total: count,
      });
    } catch (e) {
      this.logger.error(e, e?.stack);
      throw e;
    }
  }
}
