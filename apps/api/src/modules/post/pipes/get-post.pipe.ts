import { ORDER } from '@beincom/constants';
import { Injectable, PipeTransform } from '@nestjs/common';

import { GetPostDto } from '../dto/requests';

@Injectable()
export class GetPostPipe implements PipeTransform {
  public transform(getPostDto: GetPostDto): GetPostDto {
    if (!getPostDto.commentOrder) {
      getPostDto.commentOrder = ORDER.DESC;
    }
    if (!getPostDto.childCommentOrder) {
      getPostDto.childCommentOrder = ORDER.DESC;
    }

    if (!getPostDto.commentLimit) {
      getPostDto.commentLimit = 10;
    }

    if (!getPostDto.childCommentLimit) {
      getPostDto.childCommentLimit = 0;
    }

    if (!getPostDto.withComment) {
      getPostDto.withComment = false;
    }

    return getPostDto;
  }
}
