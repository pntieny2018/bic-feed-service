import { GetPostDto } from '../dto/requests';
import { OrderEnum } from '../../../common/dto';
import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class GetPostPipe implements PipeTransform {
  public transform(getPostDto: GetPostDto): GetPostDto {
    if (!getPostDto.commentOrder) {
      getPostDto.commentOrder = OrderEnum.DESC;
    }
    if (!getPostDto.childCommentOrder) {
      getPostDto.childCommentOrder = OrderEnum.DESC;
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
