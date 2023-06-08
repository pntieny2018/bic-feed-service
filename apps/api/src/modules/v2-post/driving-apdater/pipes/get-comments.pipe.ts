import { NIL } from 'uuid';
import { OrderEnum } from '../../../../common/dto';
import { Injectable, PipeTransform } from '@nestjs/common';
import { PAGING_DEFAULT_LIMIT } from '../../../../common/constants';
import { GetListCommentsDto } from '../dto/request/get-list-comments.dto';

@Injectable()
export class GetCommentsPipe implements PipeTransform {
  public transform(getCommentDto: GetListCommentsDto): GetListCommentsDto {
    if (!getCommentDto.limit) {
      getCommentDto.limit = PAGING_DEFAULT_LIMIT;
    }
    if (!getCommentDto.order) {
      getCommentDto.order = OrderEnum.DESC;
    }
    if (!getCommentDto.parentId) {
      getCommentDto.parentId = NIL;
    }
    return getCommentDto;
  }
}
