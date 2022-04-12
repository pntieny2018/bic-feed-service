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
import { CommentService } from './comment.service';
import { CommentResponseDto } from './dto/response';
import { APP_VERSION } from '../../common/constants';
import { CreateCommentPipe, GetCommentsPipe } from './pipes';
import { CreateCommentDto, GetCommentDto } from './dto/requests';
import { UpdateCommentDto } from './dto/requests/update-comment.dto';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiTags('Comment')
@ApiSecurity('authorization')
@Controller({
  version: APP_VERSION,
  path: 'comments',
})
export class CommentController {
  private _logger = new Logger(CommentController.name);

  public constructor(private _commentService: CommentService) {}

  @ApiOperation({ summary: 'Get comment list' })
  @Get('/')
  public getList(
    @AuthUser() user: UserDto,
    @Query(GetCommentsPipe) getCommentDto: GetCommentDto
  ): Promise<PageDto<CommentResponseDto>> {
    this._logger.debug('get comments');
    return this._commentService.getComments(user, getCommentDto);
  }

  @ApiOperation({ summary: 'Create new comment' })
  @ApiOkResponse({
    type: CommentResponseDto,
    description: 'Create comment successfully',
  })
  @Post('/')
  public create(
    @AuthUser() user: UserDto,
    @Body(CreateCommentPipe) createCommentDto: CreateCommentDto
  ): Promise<CommentResponseDto> {
    this._logger.debug(
      `create comment by ${user.id} with body: ${JSON.stringify(createCommentDto)}`
    );
    return this._commentService.create(user, createCommentDto);
  }

  @ApiOperation({ summary: 'Reply comment' })
  @ApiOkResponse({
    type: CommentResponseDto,
    description: 'Create reply comment successfully',
  })
  @Post('/:commentId/reply')
  public reply(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body(CreateCommentPipe) createCommentDto: CreateCommentDto
  ): Promise<any> {
    this._logger.debug('reply comment');
    return this._commentService.create(user, createCommentDto, commentId);
  }

  @ApiOperation({ summary: 'Get comment' })
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
    return this._commentService.getComment(user, commentId);
  }

  @ApiOperation({ summary: 'Update comment' })
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

  @ApiOperation({ summary: 'Delete comment' })
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
