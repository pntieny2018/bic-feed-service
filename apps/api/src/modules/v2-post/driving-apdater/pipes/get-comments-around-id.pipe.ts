import { Injectable, PipeTransform } from '@nestjs/common';

import { GetCommentsAroundIdDto } from '../dto/request';

@Injectable()
export class GetCommentsAroundIdPipe implements PipeTransform {
  public transform(getCommentDto: GetCommentsAroundIdDto): GetCommentsAroundIdDto {
    if (!getCommentDto.limit) {
      getCommentDto.limit = 10;
    }
    if (!getCommentDto.targetChildLimit) {
      getCommentDto.targetChildLimit = 10;
    }

    return getCommentDto;
  }
}
