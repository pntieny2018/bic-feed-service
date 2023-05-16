import { AuthUser } from '../../../auth';
import { CommandBus } from '@nestjs/cqrs';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
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
  ContentNoCommentPermissionException,
  ContentNotFoundException,
} from '../../domain/exception';
import {
  DeleteCommentCommand,
  DeleteCommentCommandPayload,
} from '../../application/command/delete-comment/delete-comment.command';

@ApiTags('Comment v2')
@ApiSecurity('authorization')
@Controller({
  version: '2',
  path: 'comments',
})
export class CommentController {
  public constructor(private readonly _commandBus: CommandBus) {}

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
        } as CreateCommentCommandPayload)
      );
      return data;
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
          throw new NotFoundException(e);
        case ContentNoCommentPermissionException:
          throw new ForbiddenException(e);
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
        } as ReplyCommentCommandPayload)
      );
      return data;
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
        case CommentReplyNotExistException:
          throw new NotFoundException(e);
        case ContentNoCommentPermissionException:
          throw new ForbiddenException(e);
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
  ): Promise<boolean> {
    try {
      return this._commandBus.execute<UpdateCommentCommand, boolean>(
        new UpdateCommentCommand({
          ...updateCommentRequestDto,
          id: commentId,
          actor: user,
        } as UpdateCommentCommandPayload)
      );
    } catch (e) {
      switch (e.constructor) {
        case ContentNotFoundException:
        case CommentNotFoundException:
          throw new NotFoundException(e);
        case ContentNoCommentPermissionException:
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
  ): Promise<boolean> {
    try {
      return this._commandBus.execute<DeleteCommentCommand, boolean>(
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
        case DomainModelException:
          throw new BadRequestException(e);
        default:
          throw e;
      }
    }
  }
}
