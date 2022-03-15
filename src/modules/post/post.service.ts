import { InjectModel } from '@nestjs/sequelize';
import { plainToClass } from 'class-transformer';
import { PostModel } from '../../database/models/post.model';
import { CreatePostDto } from './dto/requests';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PostDto } from './dto/responses';

@Injectable()
export class PostService {
  /**
   * Logger
   * @private
   */
  private _logger = new Logger(PostService.name);

  public constructor(
    @InjectModel(PostModel)
    private _postModel: typeof PostModel
  ) {}

  /**
   * Create recent search
   * @param createdBy Number
   * @param createPostDto CreatePostDto
   * @returns Promise resolve recentSearchPostDto
   * @throws HttpException
   */
  public async createPost(createdBy: number, createPostDto: CreatePostDto) {
    try {
      const post = this._postModel.findOne({ where: { id: 1 } });
      return post;
      const result = plainToClass(PostDto, post, {
        excludeExtraneousValues: true,
      });
      return result;
    } catch (error) {
      this._logger.error(error, error?.stack);
      //this.sentryService.captureException(error);

      throw new HttpException("Can't create recent search", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete recent search by id
   * @param createdBy Number
   * @param id Number
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async delete(createdBy: number, id: number): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      this._logger.error(error);
      //this.sentryService.captureException(error);

      throw new HttpException("Can't delete recent search", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
