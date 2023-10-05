import { ORDER } from '@beincom/constants';
import { Injectable, PipeTransform } from '@nestjs/common';
import { NIL } from 'uuid';

import { PAGING_DEFAULT_LIMIT } from '../../../../common/constants';
import { GetListCommentsDto } from '../dto/request';

@Injectable()
export class GetCommentsPipe implements PipeTransform {
  public transform(getCommentDto: GetListCommentsDto): GetListCommentsDto {
    if (!getCommentDto.limit) {
      getCommentDto.limit = PAGING_DEFAULT_LIMIT;
    }
    if (!getCommentDto.order) {
      getCommentDto.order = ORDER.DESC;
    }
    if (!getCommentDto.parentId) {
      getCommentDto.parentId = NIL;
    }
    return getCommentDto;
  }
}
