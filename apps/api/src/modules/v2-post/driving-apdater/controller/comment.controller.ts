import { PaginatedResponse } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Version,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { instanceToInstance } from 'class-transformer';

import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants';
import { ROUTES } from '../../../../common/constants/routes.constant';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import {
  CreateCommentCommand,
  CreateCommentCommandPayload,
  DeleteCommentCommand,
  DeleteCommentCommandPayload,
  ReplyCommentCommand,
  ReplyCommentCommandPayload,
  ReportCommentCommand,
  UpdateCommentCommand,
  UpdateCommentCommandPayload,
} from '../../application/command/comment';
import {
  CommentBaseDto,
  FindCommentsAroundIdDto,
  FindCommentsPaginationDto,
  ReportTargetDto,
} from '../../application/dto';
import {
  FindCommentsAroundIdQuery,
  FindCommentsPaginationQuery,
  GetMyReportCommentsQuery,
} from '../../application/query/comment';
import {
  CreateCommentRequestDto,
  CreateReportDto,
  GetCommentsAroundIdDto,
  GetListCommentsDto,
  GetMyReportedCommentsRequestDto,
  ReplyCommentRequestDto,
  UpdateCommentRequestDto,
} from '../dto/request';
import { CreateCommentPipe } from '../pipes/create-comment.pipe';
import { GetCommentsAroundIdPipe } from '../pipes/get-comments-around-id.pipe';
import { GetCommentsPipe } from '../pipes/get-comments.pipe';

@ApiTags('Comment v2')
@ApiSecurity('authorization')
@Controller()
export class CommentController {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @ApiOperation({ summary: 'Get comment list' })
  @ApiOkResponse({
    type: FindCommentsPaginationDto,
  })
  @ResponseMessages({
    success: 'Get comments successfully',
  })
  @Version(ROUTES.COMMENT.GET_LIST.VERSIONS)
  @Get(ROUTES.COMMENT.GET_LIST.PATH)
  public async getList(
    @AuthUser(false) user: UserDto,
    @Query(GetCommentsPipe) getListCommentsDto: GetListCommentsDto
  ): Promise<FindCommentsPaginationDto> {
    const data = await this._queryBus.execute(
      new FindCommentsPaginationQuery({
        authUser: user,
        ...getListCommentsDto,
        contentId: getListCommentsDto.postId,
      })
    );
    return instanceToInstance(data, {
      groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC],
    });
  }

  @ApiOperation({ summary: 'Get my reported comments' })
  @Get(ROUTES.COMMENT.GET_REPORTS.PATH)
  @Version(ROUTES.COMMENT.GET_REPORTS.VERSIONS)
  public async getMyReportedComments(
    @AuthUser() authUser: UserDto,
    @Query() query: GetMyReportedCommentsRequestDto
  ): Promise<PaginatedResponse<ReportTargetDto>> {
    const commentsReported = await this._queryBus.execute(
      new GetMyReportCommentsQuery({
        authUser,
        ...query,
      })
    );

    return instanceToInstance(commentsReported, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Get comments around a comment' })
  @ResponseMessages({
    success: 'Get comments around a comment successfully',
  })
  @Version(ROUTES.COMMENT.GET_AROUND_COMMENT.VERSIONS)
  @Get(ROUTES.COMMENT.GET_AROUND_COMMENT.PATH)
  public async getCommentsAroundId(
    @AuthUser(false) user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Query(GetCommentsAroundIdPipe) getCommentsAroundIdDto: GetCommentsAroundIdDto
  ): Promise<FindCommentsAroundIdDto> {
    const data = await this._queryBus.execute(
      new FindCommentsAroundIdQuery({ authUser: user, commentId, ...getCommentsAroundIdDto })
    );
    return instanceToInstance(data, {
      groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC],
    });
  }

  @ApiOperation({ summary: 'Create new comment' })
  @ApiOkResponse({
    type: CommentBaseDto,
    description: 'Create comment successfully',
  })
  @ResponseMessages({
    success: 'message.comment.created_success',
  })
  @Version(ROUTES.COMMENT.CREATE.VERSIONS)
  @Post(ROUTES.COMMENT.CREATE.PATH)
  public async create(
    @AuthUser() user: UserDto,
    @Body(CreateCommentPipe) createCommentDto: CreateCommentRequestDto
  ): Promise<CommentBaseDto> {
    const data = await this._commandBus.execute<CreateCommentCommand, CommentBaseDto>(
      new CreateCommentCommand({
        ...createCommentDto,
        contentId: createCommentDto.postId,
        actor: user,
        media: createCommentDto.media
          ? {
              files: createCommentDto.media?.files.map((file) => file.id),
              images: createCommentDto.media?.images.map((image) => image.id),
              videos: createCommentDto.media?.videos.map((video) => video.id),
            }
          : undefined,
      } as CreateCommentCommandPayload)
    );
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Reply comment' })
  @ApiOkResponse({
    type: CommentBaseDto,
    description: 'Create reply comment successfully',
  })
  @ResponseMessages({
    success: 'message.comment.replied_success',
  })
  @Version(ROUTES.COMMENT.REPLY.VERSIONS)
  @Post(ROUTES.COMMENT.REPLY.PATH)
  public async reply(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body(CreateCommentPipe) replyCommentRequestDto: ReplyCommentRequestDto
  ): Promise<CommentBaseDto> {
    const data = await this._commandBus.execute<ReplyCommentCommand, CommentBaseDto>(
      new ReplyCommentCommand({
        ...replyCommentRequestDto,
        contentId: replyCommentRequestDto.postId,
        parentId: commentId,
        actor: user,
        media: replyCommentRequestDto.media
          ? {
              files: replyCommentRequestDto.media?.files.map((file) => file.id),
              images: replyCommentRequestDto.media?.images.map((image) => image.id),
              videos: replyCommentRequestDto.media?.videos.map((video) => video.id),
            }
          : undefined,
      } as ReplyCommentCommandPayload)
    );
    return instanceToInstance(data, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  @ApiOperation({ summary: 'Update comment' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Update comment successfully',
  })
  @ResponseMessages({
    success: 'message.comment.updated_success',
  })
  @Version(ROUTES.COMMENT.UPDATE.VERSIONS)
  @Put(ROUTES.COMMENT.UPDATE.PATH)
  public async update(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() updateCommentRequestDto: UpdateCommentRequestDto
  ): Promise<void> {
    await this._commandBus.execute<UpdateCommentCommand, void>(
      new UpdateCommentCommand({
        ...updateCommentRequestDto,
        commentId,
        actor: user,
        media: updateCommentRequestDto.media
          ? {
              files: (updateCommentRequestDto.media?.files || []).map((file) => file.id),
              images: (updateCommentRequestDto.media?.images || []).map((image) => image.id),
              videos: (updateCommentRequestDto.media?.videos || []).map((video) => video.id),
            }
          : undefined,
      } as UpdateCommentCommandPayload)
    );
  }

  @ApiOperation({ summary: 'Delete comment' })
  @ApiOkResponse({
    type: Boolean,
    description: 'Delete comment successfully',
  })
  @ResponseMessages({
    success: 'message.comment.deleted_success',
  })
  @Version(ROUTES.COMMENT.DELETE.VERSIONS)
  @Delete(ROUTES.COMMENT.DELETE.PATH)
  public async destroy(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string
  ): Promise<void> {
    await this._commandBus.execute<DeleteCommentCommand, void>(
      new DeleteCommentCommand({
        commentId,
        actor: user,
      } as DeleteCommentCommandPayload)
    );
  }

  @ApiOperation({ summary: 'Report comment' })
  @ApiOkResponse({ description: 'Reported comment successfully' })
  @ResponseMessages({
    success: 'Reported comment successfully',
    error: 'Reported comment failed',
  })
  @Post(ROUTES.COMMENT.CREATE_REPORT.PATH)
  @Version(ROUTES.COMMENT.CREATE_REPORT.VERSIONS)
  public async reportComment(
    @AuthUser() authUser: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() input: CreateReportDto
  ): Promise<void> {
    return this._commandBus.execute(
      new ReportCommentCommand({
        authUser,
        commentId,
        ...input,
      })
    );
  }
}
