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
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { instanceToInstance } from 'class-transformer';

import { VERSIONS_SUPPORTED } from '../../../../common/constants';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants/transformer.constant';
import { AuthUser, ResponseMessages } from '../../../../common/decorators';
import { UserDto } from '../../../v2-user/application/user.dto';
import {
  CreateCommentCommand,
  CreateCommentCommandPayload,
} from '../../application/command/create-comment/create-comment.command';
import {
  DeleteCommentCommand,
  DeleteCommentCommandPayload,
} from '../../application/command/delete-comment/delete-comment.command';
import {
  ReplyCommentCommand,
  ReplyCommentCommandPayload,
} from '../../application/command/reply-comment/reply-comment.command';
import {
  UpdateCommentCommand,
  UpdateCommentCommandPayload,
} from '../../application/command/update-comment/update-comment.command';
import {
  CommentDto,
  FindCommentsAroundIdDto,
  FindCommentsPaginationDto,
} from '../../application/dto';
import { FindCommentsPaginationQuery } from '../../application/query/find-comments/find-comments-pagination.query';
import { FindCommentsAroundIdQuery } from '../../application/query/find-comments-around-id/find-comments-around-id.query';
import {
  CreateCommentRequestDto,
  GetCommentsAroundIdDto,
  GetListCommentsDto,
  ReplyCommentRequestDto,
  UpdateCommentRequestDto,
} from '../dto/request';
import { CreateCommentPipe } from '../pipes/create-comment.pipe';
import { GetCommentsAroundIdPipe } from '../pipes/get-comments-around-id.pipe';
import { GetCommentsPipe } from '../pipes/get-comments.pipe';

@ApiTags('Comment v2')
@ApiSecurity('authorization')
@Controller({
  version: VERSIONS_SUPPORTED,
  path: 'comments',
})
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
  @Get('/')
  public async getList(
    @AuthUser(false) user: UserDto,
    @Query(GetCommentsPipe) getListCommentsDto: GetListCommentsDto
  ): Promise<FindCommentsPaginationDto> {
    const data = await this._queryBus.execute(
      new FindCommentsPaginationQuery({ authUser: user, ...getListCommentsDto })
    );
    return data;
  }

  @ApiOperation({ summary: 'Get comments around a comment' })
  @ResponseMessages({
    success: 'Get comments around a comment successfully',
  })
  @Get('/:commentId')
  public async getCommentsAroundId(
    @AuthUser(false) user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Query(GetCommentsAroundIdPipe) getCommentsAroundIdDto: GetCommentsAroundIdDto
  ): Promise<FindCommentsAroundIdDto> {
    const data = await this._queryBus.execute(
      new FindCommentsAroundIdQuery({ authUser: user, commentId, ...getCommentsAroundIdDto })
    );
    return data;
  }

  @ApiOperation({ summary: 'Create new comment' })
  @ApiOkResponse({
    type: CommentDto,
    description: 'Create comment successfully',
  })
  @ResponseMessages({
    success: 'message.comment.created_success',
  })
  @Post('/')
  public async create(
    @AuthUser() user: UserDto,
    @Body(CreateCommentPipe) createCommentDto: CreateCommentRequestDto
  ): Promise<CommentDto> {
    const data = await this._commandBus.execute<CreateCommentCommand, CommentDto>(
      new CreateCommentCommand({
        ...createCommentDto,
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
    type: CommentDto,
    description: 'Create reply comment successfully',
  })
  @ResponseMessages({
    success: 'message.comment.replied_success',
  })
  @Post('/:commentId/reply')
  public async reply(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body(CreateCommentPipe) replyCommentRequestDto: ReplyCommentRequestDto
  ): Promise<CommentDto> {
    const data = await this._commandBus.execute<ReplyCommentCommand, CommentDto>(
      new ReplyCommentCommand({
        ...replyCommentRequestDto,
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
  @Put('/:commentId')
  public async update(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() updateCommentRequestDto: UpdateCommentRequestDto
  ): Promise<void> {
    await this._commandBus.execute<UpdateCommentCommand, void>(
      new UpdateCommentCommand({
        ...updateCommentRequestDto,
        id: commentId,
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
  @Delete('/:commentId')
  public async destroy(
    @AuthUser() user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string
  ): Promise<void> {
    await this._commandBus.execute<DeleteCommentCommand, void>(
      new DeleteCommentCommand({
        id: commentId,
        actor: user,
      } as DeleteCommentCommandPayload)
    );
  }
}
