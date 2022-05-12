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
import {
  CreateCommentDto,
  UpdateCommentDto,
  CreateReplyCommentDto,
  GetCommentsDto,
  GetCommentEditedHistoryDto,
} from './dto/requests';
import {
  CommentHasBeenCreatedEvent,
  CommentHasBeenDeletedEvent,
  CommentHasBeenUpdatedEvent,
} from '../../events/comment';
import { PageDto } from '../../common/dto';
import { AuthUser, UserDto } from '../auth';
import { CommentService } from './comment.service';
import { APP_VERSION } from '../../common/constants';
import { ResponseMessages } from '../../common/decorators';
import { CreateCommentPipe, GetCommentsPipe } from './pipes';
import { GetCommentLinkDto } from './dto/requests/get-comment-link.dto';
import { InternalEventEmitterService } from '../../app/custom/event-emitter';
import { CommentEditedHistoryDto, CommentResponseDto } from './dto/response';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CommentDetailResponseDto } from './dto/response/comment-detail.response.dto';
import { NIL as NIL_UUID } from 'uuid';

@ApiTags('Comment')
@ApiSecurity('authorization')
@Controller({
  version: APP_VERSION,
  path: 'comments',
})
export class CommentController {
  private _logger = new Logger(CommentController.name);

  public constructor(
    private _commentService: CommentService,
    private _eventEmitter: InternalEventEmitterService
  ) {}

  @ApiOperation({ summary: 'Get comment list' })
  @ResponseMessages({
    success: 'Get comments successfully',
  })
  @Get('/')
  public getList(
    @AuthUser() user: UserDto,
    @Query(GetCommentsPipe) getCommentsDto: GetCommentsDto
  ): Promise<PageDto<CommentResponseDto>> {
    this._logger.debug('get comments');
    return this._commentService.getComments(user, getCommentsDto);
  }

  @ApiOperation({ summary: 'Create new comment' })
  @ApiOkResponse({
    type: CommentResponseDto,
    description: 'Create comment successfully',
  })
  @ResponseMessages({
    success: 'Create comment successfully',
  })
  @Post('/')
  public async create(
    @AuthUser() user: UserDto,
    @Body(CreateCommentPipe) createCommentDto: CreateCommentDto
  ): Promise<CommentResponseDto> {
    this._logger.debug(
      `create comment by ${user.id} with body: ${JSON.stringify(createCommentDto)}`
    );
    const comment = await this._commentService.create(user, createCommentDto);

    const commentResponse = await this._commentService.getComment(user, comment.id);

    this._eventEmitter.emit(
      new CommentHasBeenCreatedEvent({
        actor: user,
        commentResponse: commentResponse,
      })
    );

    return commentResponse;
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
    @Param('commentId') commentId: string,
    @Body(CreateCommentPipe) createReplyCommentDto: CreateReplyCommentDto
  ): Promise<CommentResponseDto> {
    this._logger.debug('reply comment');
    const comment = await this._commentService.create(
      user,
      {
        ...createReplyCommentDto,
        postId: NIL_UUID,
      },
      commentId
    );

    const commentResponse = await this._commentService.getComment(user, comment.id);

    this._eventEmitter.emit(
      new CommentHasBeenCreatedEvent({
        actor: user,
        commentResponse: commentResponse,
      })
    );

    return commentResponse;
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
    @AuthUser() user: UserDto,
    @Param('commentId') commentId: string,
    @Query() getCommentLinkDto: GetCommentLinkDto
  ): Promise<any> {
    this._logger.debug('get comment');
    return this._commentService.getCommentLink(commentId, user, getCommentLinkDto);
  }

  @ApiOperation({ summary: 'Get comment edited history' })
  @ApiOkResponse({
    type: CommentEditedHistoryDto,
  })
  @Get('/:commentId/edited-history')
  public getCommentEditedHistory(
    @AuthUser() user: UserDto,
    @Param('commentId') commentId: string,
    @Query() getCommentEditedHistoryDto: GetCommentEditedHistoryDto
  ): Promise<PageDto<CommentEditedHistoryDto>> {
    return this._commentService.getCommentEditedHistory(
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
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto
  ): Promise<CommentResponseDto> {
    this._logger.debug('update comment');
    const response = await this._commentService.update(user, commentId, updateCommentDto);

    const commentResponse = await this._commentService.getComment(user, response.comment.id);
    this._eventEmitter.emit(
      new CommentHasBeenUpdatedEvent({
        actor: user,
        oldComment: response.oldComment,
        commentResponse: commentResponse,
      })
    );
    return commentResponse;
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
    @Param('commentId') commentId: string
  ): Promise<boolean> {
    this._logger.debug('delete comment');
    const comment = await this._commentService.destroy(user, commentId);

    this._eventEmitter.emit(
      new CommentHasBeenDeletedEvent({
        actor: user,
        comment: comment,
      })
    );
    return true;
  }
}
