import { CreateCommentDto } from '../dto/requests';
import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class CreateCommentPipe implements PipeTransform {
  public transform(createCommentDto: CreateCommentDto): CreateCommentDto {
    if (!createCommentDto.data.content) {
      createCommentDto.data.content = null;
    }
    if (!createCommentDto.mentions) {
      createCommentDto.mentions = [];
    }
    if (!createCommentDto.data.files) {
      createCommentDto.data.files = [];
    }
    if (!createCommentDto.data.videos) {
      createCommentDto.data.videos = [];
    }
    if (!createCommentDto.data.images) {
      createCommentDto.data.images = [];
    }
    return createCommentDto;
  }
}
