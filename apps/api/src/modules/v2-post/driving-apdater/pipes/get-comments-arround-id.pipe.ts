import { Injectable, PipeTransform } from '@nestjs/common';
import { GetCommentsArroundIdDto } from '../dto/request';

@Injectable()
export class GetCommentsArroundIdPipe implements PipeTransform {
  public transform(getCommentDto: GetCommentsArroundIdDto): GetCommentsArroundIdDto {
    if (!getCommentDto.limit) {
      getCommentDto.limit = 10;
    }
    if (!getCommentDto.targetChildLimit) {
      getCommentDto.targetChildLimit = 10;
    }

    return getCommentDto;
  }
}
