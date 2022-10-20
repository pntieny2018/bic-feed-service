import { Injectable, PipeTransform } from '@nestjs/common';
import { GetCommentLinkDto } from '../dto/requests/get-comment-link.dto';

@Injectable()
export class GetCommentLinkPipe implements PipeTransform {
  public transform(getCommentDto: GetCommentLinkDto): GetCommentLinkDto {
    if (!getCommentDto.targetChildLimit) {
      getCommentDto.targetChildLimit = 0;
    }
    if (!getCommentDto.childLimit) {
      getCommentDto.childLimit = 0;
    }
    if (!getCommentDto.limit) {
      getCommentDto.limit = 10;
    }

    return getCommentDto;
  }
}
