import { AuthUser, UserDto } from '../auth';
import { CreateCommentDto } from './dto/requests';
import { CommentService } from './comment.service';
import { APP_VERSION } from '../../common/constants';
import { CommentModel } from '../../database/models/comment.model';
import { Body, Controller, Delete, Get, Logger, Post, Put } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { GenericApiOkResponse } from '../../common/decorators';

@ApiTags('Comments')
@ApiSecurity('authorization')
@Controller({
  path: 'comments',
  version: APP_VERSION,
})
export class CommentController {
  private _logger = new Logger(CommentController.name);

  public constructor(private _commentService: CommentService) {}

  @GenericApiOkResponse(CommentModel, 'Create comment successfully')
  @Post()
  public create(
    @AuthUser() user: UserDto,
    @Body() createCommentDto: CreateCommentDto
  ): Promise<CommentModel> {
    this._logger.debug(
      `create comment by ${user.userId} with body: ${JSON.stringify(createCommentDto)}`
    );

    return this._commentService.create(user, createCommentDto);
  }

  @Get()
  public get(): void {
    this._logger.log('get comment');
  }

  @Put()
  public update(): void {
    this._logger.log('update comment');
  }

  @Delete()
  public destroy(): void {
    this._logger.log('delete comment');
  }
}
