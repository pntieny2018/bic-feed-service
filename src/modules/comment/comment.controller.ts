import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { APP_VERSION } from '../../common/constants';
import { ResponseMessages } from '../../common/decorators';
import { PageDto } from '../../common/dto';
import { AuthUser, UserDto } from '../auth';
import { CommentAppService } from './application/comment.app-service';
import { CommentHistoryService } from './comment-history.service';
import {
  CreateCommentDto,
  CreateReplyCommentDto,
  GetCommentEditedHistoryDto,
  GetCommentsDto,
  UpdateCommentDto,
} from './dto/requests';
import { GetCommentLinkDto } from './dto/requests/get-comment-link.dto';
import { CommentEditedHistoryDto, CommentResponseDto } from './dto/response';
import { CommentDetailResponseDto } from './dto/response/comment-detail.response.dto';
import { CreateCommentPipe, GetCommentsPipe } from './pipes';
import { GetCommentLinkPipe } from './pipes/get-comment-link.pipe';

@ApiTags('Comment')
@ApiSecurity('authorization')
@Controller({
  version: APP_VERSION,
  path: 'comments',
})
export class CommentController {
  private _logger = new Logger(CommentController.name);

  public constructor(
    private _commentAppService: CommentAppService,
    private _commentHistoryService: CommentHistoryService
  ) {}

  @ApiOperation({ summary: 'Get comment list' })
  @ResponseMessages({
    success: 'Get comments successfully',
  })
  @Get('/')
  public getList(
    @AuthUser(false) user: UserDto,
    @Query(GetCommentsPipe) getCommentsDto: GetCommentsDto
  ): Promise<PageDto<CommentResponseDto>> {
    this._logger.debug('get comments');
    return this._commentAppService.getList(user, getCommentsDto);
  }

  @ApiOperation({ summary: 'Create new comment' })
  @ApiOkResponse({
    type: CommentResponseDto,
    description: 'Create comment successfully',
  })
  @ResponseMessages({
    success: 'Create comment successfully.',
  })
  @Post('/')
  public async create(
    @AuthUser() user: UserDto,
    @Body(CreateCommentPipe) createCommentDto: CreateCommentDto
  ): Promise<CommentResponseDto> {
    return this._commentAppService.create(user, createCommentDto);
  }

  @ApiOperation({ summary: 'Reply comment' })
  @ApiOkResponse({
    type: CommentResponseDto,
    description: 'Create reply comment successfully',
  })
  @ResponseMessages({
    success: 'Create reply comment successfully',
  })
  @Post('/:commentId/reply')
  public async reply(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body(CreateCommentPipe) createReplyCommentDto: CreateReplyCommentDto
  ): Promise<CommentResponseDto> {
    this._logger.debug('reply comment');
    return this._commentAppService.reply(user, commentId, createReplyCommentDto);
  }

  @ApiOperation({ summary: 'Get comment detail' })
  @ApiOkResponse({
    type: CommentDetailResponseDto,
    description: 'Get comment successfully',
  })
  @ResponseMessages({
    success: 'Get comment successfully',
  })
  @Get('/:commentId')
  public get(
    @AuthUser(false) user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Query(GetCommentLinkPipe) getCommentLinkDto: GetCommentLinkDto
  ): Promise<any> {
    this._logger.debug('get comment');
    return this._commentAppService.get(user, commentId, getCommentLinkDto);
  }

  @ApiOperation({ summary: 'Get comment edited history' })
  @ApiOkResponse({
    type: CommentEditedHistoryDto,
  })
  @Get('/:commentId/edited-history')
  public getCommentEditedHistory(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Query() getCommentEditedHistoryDto: GetCommentEditedHistoryDto
  ): Promise<PageDto<CommentEditedHistoryDto>> {
    return this._commentHistoryService.getCommentEditedHistory(
      user,
      commentId,
      getCommentEditedHistoryDto
    );
  }

  @ApiOperation({ summary: 'Update comment' })
  @ApiOkResponse({
    type: CommentResponseDto,
    description: 'Update comment successfully',
  })
  @ResponseMessages({
    success: 'Update comment successfully',
  })
  @Put('/:commentId')
  public async update(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() updateCommentDto: UpdateCommentDto
  ): Promise<CommentResponseDto> {
    this._logger.debug('update comment');
    return this._commentAppService.update(user, commentId, updateCommentDto);
  }

  @ApiOperation({ summary: 'Delete comment' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete comment successfully',
  })
  @ResponseMessages({
    success: 'Delete comment successfully',
  })
  @Delete('/:commentId')
  public async destroy(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string
  ): Promise<boolean> {
    this._logger.debug('delete comment');
    return this._commentAppService.destroy(user, commentId);
  }
}
