import { CreateCommentDto } from '../dto/requests';
import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class CreateCommentPipe implements PipeTransform {
  public transform(createCommentDto: CreateCommentDto): CreateCommentDto {
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
