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
import { APP_VERSION } from '../../common/constants';
import { ResponseMessages } from '../../common/decorators';
import { PageDto } from '../../common/dto';
import { AuthUser } from '../auth';
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
import { UserDto } from '../v2-user/application';

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
    return this._commentAppService.getList(user, getCommentsDto);
  }

  @ApiOperation({ summary: 'Create new comment' })
  @ApiOkResponse({
    type: CommentResponseDto,
    description: 'Create comment successfully',
  })
  @ResponseMessages({
    success: 'message.comment.created_success',
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
    success: 'message.comment.replied_success',
  })
  @Post('/:commentId/reply')
  public async reply(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body(CreateCommentPipe) createReplyCommentDto: CreateReplyCommentDto
  ): Promise<CommentResponseDto> {
    return this._commentAppService.reply(user, commentId, createReplyCommentDto);
  }

  @ApiOperation({ summary: 'Get comments arround comment ID' })
  @ApiOkResponse({
    type: CommentDetailResponseDto,
  })
  @Get('/:commentId')
  public getCommentsArroundId(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Query(GetCommentLinkPipe) getCommentsArroundIdDto: GetCommentLinkDto,
    @AuthUser(false) user: UserDto
  ): Promise<any> {
    return this._commentAppService.getCommentsArroundId(commentId, getCommentsArroundIdDto, user);
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
  @ResponseMessages({
    success: 'message.comment.updated_success',
  })
  @Put('/:commentId')
  public async update(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() updateCommentDto: UpdateCommentDto
  ): Promise<CommentResponseDto> {
    return this._commentAppService.update(user, commentId, updateCommentDto);
  }

  @ApiOperation({ summary: 'Delete comment' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete comment successfully',
  })
  @ResponseMessages({
    success: 'message.comment.deleted_success',
  })
  @Delete('/:commentId')
  public async destroy(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string
  ): Promise<boolean> {
    return this._commentAppService.destroy(user, commentId);
  }
}
