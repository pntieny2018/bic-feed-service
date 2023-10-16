import { ORDER } from '@beincom/constants';
import { Injectable, PipeTransform } from '@nestjs/common';
import { NIL as NIL_UUID } from 'uuid';

import { GetCommentsDto } from '../dto/requests';

@Injectable()
export class GetCommentsPipe implements PipeTransform {
  public transform(getCommentDto: GetCommentsDto): GetCommentsDto {
    if (!getCommentDto.limit) {
      getCommentDto.limit = 25;
    }
    if (!getCommentDto.order) {
      getCommentDto.order = ORDER.DESC;
    }
    if (!getCommentDto.childOrder) {
      getCommentDto.childOrder = ORDER.DESC;
    }
    if (!getCommentDto.childLimit) {
      getCommentDto.childLimit = 0;
    }
    if (!getCommentDto.parentId) {
      getCommentDto.parentId = NIL_UUID;
    }

    return getCommentDto;
  }
}
