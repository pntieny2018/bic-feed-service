import { AuthUser } from '../../../auth';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ResponseMessages } from '../../../../common/decorators';
import { CreateCommentDto } from '../../application/command/create-comment/create-comment.dto';
import { UserDto } from '../../../v2-user/application/user.dto';
import { CreateCommentPipe } from '../pipes/create-comment.pipe';
import { CreateCommentRequestDto } from '../dto/request/create-comment.request.dto';
import {
  CreateCommentCommand,
  CreateCommentCommandPayload,
} from '../../application/command/create-comment/create-comment.command';
import { DomainModelException } from '../../../../common/exceptions/domain-model.exception';
import { ReplyCommentDto } from '../../application/command/reply-comment/reply-comment.dto';
import { ReplyCommentRequestDto } from '../dto/request/reply-comment.request.dto';
import {
  ReplyCommentCommand,
  ReplyCommentCommandPayload,
} from '../../application/command/reply-comment/reply-comment.command';
import { UpdateCommentRequestDto } from '../dto/request/update-comment.request.dto';
import {
  UpdateCommentCommand,
  UpdateCommentCommandPayload,
} from '../../application/command/update-comment/update-comment.command';
import {
  CommentNotFoundException,
  CommentReplyNotExistException,
  ContentNoCRUDPermissionException,
  ContentNoCommentPermissionException,
  ContentNotFoundException,
  ContentRequireGroupException,
  InvalidCursorParamsException,
  InvalidResourceImageException,
  MentionUserNotFoundException,
} from '../../domain/exception';
import {
  DeleteCommentCommand,
  DeleteCommentCommandPayload,
} from '../../application/command/delete-comment/delete-comment.command';
import { VERSIONS_SUPPORTED } from '../../../../common/constants';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../../common/constants/transformer.constant';
import { instanceToInstance } from 'class-transformer';
import { GetCommentsPipe } from '../pipes/get-comments.pipe';
import { GetCommentsArroundIdDto, GetListCommentsDto } from '../dto/request';
import { FindCommentsPaginationQuery } from '../../application/query/find-comments/find-comments-pagination.query';
import { FindCommentsPaginationDto } from '../../application/query/find-comments/find-comments-pagination.dto';
import { GetCommentsArroundIdPipe } from '../pipes/get-comments-arround-id.pipe';
import { FindCommentsArroundIdQuery } from '../../application/query/find-comments-arround-id/find-comments-arround-id.query';
import { FindCommentsArroundIdDto } from '../../application/query/find-comments-arround-id/find-comments-arround-id.dto';

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
    try {
      const data = await this._queryBus.execute(
        new FindCommentsPaginationQuery({ authUser: user, ...getListCommentsDto })
      );
      return data;
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case InvalidCursorParamsException:
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Get comments arround a comment' })
  @ResponseMessages({
    success: 'Get comments arround a comment successfully',
  })
  @Get('/:commentId')
  public async getCommentsArroundId(
    @AuthUser(false) user: UserDto,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Query(GetCommentsArroundIdPipe) getCommentsArroundIdDto: GetCommentsArroundIdDto
  ): Promise<FindCommentsArroundIdDto> {
    try {
      const data = await this._queryBus.execute(
        new FindCommentsArroundIdQuery({ authUser: user, commentId, ...getCommentsArroundIdDto })
      );
      return data;
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case InvalidCursorParamsException:
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Create new comment' })
  @ApiOkResponse({
    type: CreateCommentDto,
    description: 'Create comment successfully',
  })
  @ResponseMessages({
    success: 'message.comment.created_success',
  })
  @Post('/')
  public async create(
    @AuthUser() user: UserDto,
    @Body(CreateCommentPipe) createCommentDto: CreateCommentRequestDto
  ): Promise<CreateCommentDto> {
    try {
      const data = await this._commandBus.execute<CreateCommentCommand, CreateCommentDto>(
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
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
        case MentionUserNotFoundException:
          throw new NotFoundException(e);
        case ContentRequireGroupException:
        case ContentNoCommentPermissionException:
          throw new ForbiddenException(e);
        case InvalidResourceImageException:
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }

  @ApiOperation({ summary: 'Reply comment' })
  @ApiOkResponse({
    type: ReplyCommentDto,
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
  ): Promise<ReplyCommentDto> {
    try {
      const data = await this._commandBus.execute<ReplyCommentCommand, ReplyCommentDto>(
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
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
        case CommentReplyNotExistException:
        case MentionUserNotFoundException:
          throw new NotFoundException(e);
        case ContentRequireGroupException:
        case ContentNoCommentPermissionException:
          throw new ForbiddenException(e);
        case InvalidResourceImageException:
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
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
    try {
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
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
        case CommentNotFoundException:
          throw new NotFoundException(e);
        case ContentRequireGroupException:
        case ContentNoCommentPermissionException:
        case ContentNoCRUDPermissionException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
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
    try {
      await this._commandBus.execute<DeleteCommentCommand, void>(
        new DeleteCommentCommand({
          id: commentId,
          actor: user,
        } as DeleteCommentCommandPayload)
      );
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
        case CommentNotFoundException:
          throw new NotFoundException(e);
        case ContentRequireGroupException:
        case ContentNoCommentPermissionException:
        case ContentNoCRUDPermissionException:
          throw new ForbiddenException(e);
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }
}
