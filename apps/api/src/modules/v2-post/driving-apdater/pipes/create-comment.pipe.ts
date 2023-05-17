import { Injectable, PipeTransform } from '@nestjs/common';
import { CreateCommentRequestDto } from '../dto/request/create-comment.request.dto';

@Injectable()
export class CreateCommentPipe implements PipeTransform {
  public transform(createCommentDto: CreateCommentRequestDto): CreateCommentRequestDto {
    if (!createCommentDto.content) {
      createCommentDto.content = null;
    }
    if (!createCommentDto.mentions) {
      createCommentDto.mentions = [];
    }
    if (!createCommentDto.media.files) {
      createCommentDto.media.files = [];
    }
    if (!createCommentDto.media.videos) {
      createCommentDto.media.videos = [];
    }
    if (!createCommentDto.media.images) {
      createCommentDto.media.images = [];
    }
    return createCommentDto;
  }
}
