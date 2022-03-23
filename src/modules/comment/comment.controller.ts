import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PageDto } from '../../common/dto';
import { AuthUser, UserDto } from '../auth';
import { CreateCommentDto } from './dto/requests';
import { CommentService } from './comment.service';
import { APP_VERSION } from '../../common/constants';
import { GetCommentDto } from './dto/requests/get-comment.dto';
import { UpdateCommentDto } from './dto/requests/update-comment.dto';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CommentResponseDto } from './dto/response/comment.response.dto';
import { CreateCommentPipe } from './pipes/create-comment.pipe';

@ApiTags('Comment')
@ApiSecurity('authorization')
@Controller({
  path: 'comment',
  version: APP_VERSION,
})
export class CommentController {
  private _logger = new Logger(CommentController.name);

  public constructor(private _commentService: CommentService) {}

  @Get('/')
  public getList(
    @AuthUser() user: UserDto,
    @Query() getCommentDto: GetCommentDto
  ): Promise<PageDto<CommentResponseDto>> {
    this._logger.debug('get comment');
    return this._commentService.getComments(user, getCommentDto);
  }

  @ApiOkResponse({
    type: CommentResponseDto,
    description: 'Create reply comment successfully',
  })
  @Post()
  public create(
    @AuthUser() user: UserDto,
    @Body(CreateCommentPipe) createCommentDto: CreateCommentDto
  ): Promise<CommentResponseDto> {
    this._logger.debug(
      `create comment by ${user.id} with body: ${JSON.stringify(createCommentDto)}`
    );
    return this._commentService.create(user, createCommentDto);
  }

  @ApiOkResponse({
    type: CommentResponseDto,
    description: 'Create reply comment successfully',
  })
  @Post('/:commentId/reply')
  public reply(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() createCommentDto: CreateCommentDto
  ): Promise<any> {
    this._logger.debug('reply comment');
    return this._commentService.create(user, createCommentDto, commentId);
  }

  @ApiOkResponse({
    type: CommentResponseDto,
    description: 'Get comment successfully',
  })
  @Get('/:commentId')
  public get(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseIntPipe) commentId: number
  ): Promise<any> {
    this._logger.debug('get comment');
    return this._commentService.getComment(commentId);
  }

  @ApiOkResponse({
    type: CommentResponseDto,
    description: 'Update comment successfully',
  })
  @Put('/:commentId')
  public update(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto
  ): Promise<CommentResponseDto> {
    this._logger.debug('update comment');
    return this._commentService.update(user, commentId, updateCommentDto);
  }

  @ApiOkResponse({
    type: Boolean,
    description: 'Delete comment successfully',
  })
  @Delete('/:commentId')
  public destroy(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseIntPipe) commentId: number
  ): Promise<boolean> {
    this._logger.debug('delete comment');
    return this._commentService.destroy(user, commentId);
  }
}
