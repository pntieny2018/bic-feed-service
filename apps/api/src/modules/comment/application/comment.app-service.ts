import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InternalEventEmitterService } from '../../../app/custom/event-emitter';
import { PageDto } from '../../../common/dto';
import {
  CommentHasBeenCreatedEvent,
  CommentHasBeenDeletedEvent,
  CommentHasBeenUpdatedEvent,
} from '../../../events/comment';
import { CommentHistoryService } from '../comment-history.service';
import { CommentService } from '../comment.service';
import {
  CreateCommentDto,
  CreateReplyCommentDto,
  GetCommentEditedHistoryDto,
  GetCommentsDto,
  UpdateCommentDto,
} from '../dto/requests';
import { GetCommentLinkDto } from '../dto/requests/get-comment-link.dto';
import { CommentEditedHistoryDto, CommentResponseDto } from '../dto/response';
import { UserDto } from '../../v2-user/application';
import { ExternalService } from '../../../app/external.service';

@Injectable()
export class CommentAppService {
  private _logger = new Logger(CommentAppService.name);

  public constructor(
    private _commentService: CommentService,
    private _commentHistoryService: CommentHistoryService,
    private _eventEmitter: InternalEventEmitterService,
    private _externalService: ExternalService
  ) {}

  public getList(
    user: UserDto,
    getCommentsDto: GetCommentsDto
  ): Promise<PageDto<CommentResponseDto>> {
    return this._commentService.getComments(getCommentsDto, user);
  }

  public async create(
    user: UserDto,
    createCommentDto: CreateCommentDto
  ): Promise<CommentResponseDto> {
    const { media } = createCommentDto;
    if (media?.images.length > 0) {
      const mediaIds = media.images.map((image) => image.id);
      const images = await this._externalService.getImageIds(mediaIds);
      if (images.length === 0) {
        throw new BadRequestException('Invalid cover image');
      }
      if (images[0].createdBy !== user.id) {
        throw new BadRequestException('You must be owner this cover');
      }
      if (images[0].status !== 'DONE') {
        throw new BadRequestException('Image is not ready to use');
      }
      // if (images[0].resource !== 'comment:content') {
      //   throw new BadRequestException('Resource type is incorrect');
      // }
      createCommentDto.media.images = images;
    }
    const comment = await this._commentService.create(user, createCommentDto);

    const commentResponse = await this._commentService.getComment(user, comment.id);

    this._eventEmitter.emit(
      new CommentHasBeenCreatedEvent({
        actor: user,
        commentId: comment.id,
      })
    );

    return commentResponse;
  }

  public async reply(
    user: UserDto,
    commentId: string,
    createReplyCommentDto: CreateReplyCommentDto
  ): Promise<CommentResponseDto> {
    const { media } = createReplyCommentDto;
    if (media?.images.length > 0) {
      const mediaIds = media.images.map((image) => image.id);
      const images = await this._externalService.getImageIds(mediaIds);
      if (images.length === 0) {
        throw new BadRequestException('Invalid cover image');
      }
      if (images[0].createdBy !== user.id) {
        throw new BadRequestException('You must be owner this cover');
      }
      if (images[0].status !== 'DONE') {
        throw new BadRequestException('Image is not ready to use');
      }
      // if (images[0].resource !== 'comment:content') {
      //   throw new BadRequestException('Resource type is incorrect');
      // }
      createReplyCommentDto.media.images = images;
    }
    const comment = await this._commentService.create(
      user,
      {
        ...createReplyCommentDto,
      },
      commentId
    );

    const commentResponse = await this._commentService.getComment(user, comment.id);

    this._eventEmitter.emit(
      new CommentHasBeenCreatedEvent({
        actor: user,
        commentId: comment.id,
      })
    );

    return commentResponse;
  }

  public getCommentsArroundId(
    commentId: string,
    getCommentsArroundIdDto: GetCommentLinkDto,
    user: UserDto
  ): Promise<any> {
    return this._commentService.getCommentsArroundId(commentId, user, getCommentsArroundIdDto);
  }

  public getCommentEditedHistory(
    user: UserDto,
    commentId: string,
    getCommentEditedHistoryDto: GetCommentEditedHistoryDto
  ): Promise<PageDto<CommentEditedHistoryDto>> {
    return this._commentHistoryService.getCommentEditedHistory(
      user,
      commentId,
      getCommentEditedHistoryDto
    );
  }

  public async update(
    user: UserDto,
    commentId: string,
    updateCommentDto: UpdateCommentDto
  ): Promise<CommentResponseDto> {
    const { media } = updateCommentDto;
    if (media?.images.length > 0) {
      const mediaIds = media.images.map((image) => image.id);
      const images = await this._externalService.getImageIds(mediaIds);
      if (images.length === 0) {
        throw new BadRequestException('Invalid cover image');
      }
      if (images[0].createdBy !== user.id) {
        throw new BadRequestException('You must be owner this cover');
      }
      if (images[0].status !== 'DONE') {
        throw new BadRequestException('Image is not ready to use');
      }
      // if (images[0].resource !== 'comment:content') {
      //   throw new BadRequestException('Resource type is incorrect');
      // }
      updateCommentDto.media.images = images;
    }
    const response = await this._commentService.update(user, commentId, updateCommentDto);

    const commentResponse = await this._commentService.getComment(user, commentId);
    this._eventEmitter.emit(
      new CommentHasBeenUpdatedEvent({
        actor: user,
        oldMentions: response.oldComment.mentions,
        commentId,
      })
    );
    return commentResponse;
  }

  public async destroy(user: UserDto, commentId: string): Promise<boolean> {
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
